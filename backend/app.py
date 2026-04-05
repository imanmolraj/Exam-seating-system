from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import pandas as pd
import json
import os
import base64
from io import BytesIO
from algorithm import generate_seating_plan

# Load .env file if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ── Gemini AI integration ──
try:
    from google import genai
    from google.genai import types
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
except ImportError:
    gemini_client = None
    print("WARNING: google-genai not installed. AI constraints disabled.")

def parse_admin_constraints(admin_text):
    """
    Uses Gemini 2.5 Flash to translate natural language admin constraints
    into structured JSON with three keys:
      - forbidden_dept_pairs: [["DeptA","DeptB"], ...]
      - fixed_invigilators:   [{"TeacherID":"100","Room":1}, ...]
      - unavailable_teachers: ["101", ...]
    """
    empty = {"forbidden_dept_pairs": [], "fixed_invigilators": [], "unavailable_teachers": []}

    if not admin_text or not admin_text.strip():
        return empty, "No constraints provided"

    if not gemini_client:
        return empty, "Gemini API key not configured. Add GEMINI_API_KEY to your .env file."

    prompt = """You are an assistant for a school exam seating system.
Extract the constraints from the administrator's request into STRICT JSON format.

Schema:
{
  "forbidden_dept_pairs": [["DeptA", "DeptB"]],
  "fixed_invigilators": [{"TeacherID": "100", "Room": 1}],
  "unavailable_teachers": ["101"]
}

Rules:
- forbidden_dept_pairs: departments that must NOT be placed in the same room
- fixed_invigilators: teachers pre-assigned to specific rooms (use exact TeacherID as string)
- unavailable_teachers: teacher IDs who are on leave / unavailable (as strings)
- If a constraint type is not mentioned, leave its array empty []
- Return ONLY valid JSON, no explanation text"""

    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"{prompt}\n\nAdministrator Request: \"{admin_text.strip()}\"",
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        constraints = json.loads(response.text)
        # Ensure all three keys exist
        for key in ["forbidden_dept_pairs", "fixed_invigilators", "unavailable_teachers"]:
            if key not in constraints:
                constraints[key] = []
        return constraints, "OK"
    except json.JSONDecodeError as e:
        return empty, f"AI returned invalid JSON: {str(e)}"
    except Exception as e:
        return empty, f"AI error: {str(e)}"

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

# Config
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///exam_seating.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = "exam-seating-super-secret-2024"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=8)

db = SQLAlchemy(app)
jwt = JWTManager(app)


# ─────────────────── Models ───────────────────
class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default="admin")  # 'superadmin' or 'admin'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.String(80), nullable=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat(),
            "created_by": self.created_by,
        }


class ExamRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    exam_name = db.Column(db.String(200), nullable=False)
    created_by = db.Column(db.String(80), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    total_students = db.Column(db.Integer)
    total_rooms = db.Column(db.Integer)
    room_utilization = db.Column(db.Float)
    fairness_index = db.Column(db.Float)
    load_variance = db.Column(db.Float)
    conflict_count = db.Column(db.Integer)
    config_json = db.Column(db.Text)
    summary_json = db.Column(db.Text)
    teacher_load_json = db.Column(db.Text)
    excel_data = db.Column(db.LargeBinary)
    unallocated_log = db.Column(db.Text)

    def to_dict(self, include_excel=False):
        d = {
            "id": self.id,
            "exam_name": self.exam_name,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat(),
            "total_students": self.total_students,
            "total_rooms": self.total_rooms,
            "room_utilization": self.room_utilization,
            "fairness_index": self.fairness_index,
            "load_variance": self.load_variance,
            "conflict_count": self.conflict_count,
            "config": json.loads(self.config_json) if self.config_json else {},
            "summary": json.loads(self.summary_json) if self.summary_json else [],
            "teacher_load": json.loads(self.teacher_load_json) if self.teacher_load_json else [],
            "unallocated_log": json.loads(self.unallocated_log) if self.unallocated_log else [],
        }
        if include_excel and self.excel_data:
            d["excel_b64"] = base64.b64encode(self.excel_data).decode()
        return d


# ─────────────────── Auth Routes ───────────────────
@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    admin = Admin.query.filter_by(username=username).first()
    if not admin or not admin.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=json.dumps({
        "id": admin.id, "username": admin.username, "role": admin.role
    }))
    return jsonify({"token": token, "admin": admin.to_dict()}), 200


@app.route("/api/auth/me", methods=["GET"])
@jwt_required()
def me():
    identity = json.loads(get_jwt_identity())
    admin = Admin.query.get(identity["id"])
    if not admin:
        return jsonify({"error": "Admin not found"}), 404
    return jsonify({"admin": admin.to_dict()}), 200


# ─────────────────── Admin Management Routes ───────────────────
@app.route("/api/admins", methods=["GET"])
@jwt_required()
def list_admins():
    admins = Admin.query.all()
    return jsonify({"admins": [a.to_dict() for a in admins]}), 200


@app.route("/api/admins", methods=["POST"])
@jwt_required()
def create_admin():
    identity = json.loads(get_jwt_identity())
    if identity["role"] != "superadmin":
        return jsonify({"error": "Only superadmins can create admins"}), 403

    data = request.get_json()
    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")
    role = data.get("role", "admin")

    if not username or not email or not password:
        return jsonify({"error": "Username, email and password required"}), 400

    if Admin.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 409
    if Admin.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 409

    new_admin = Admin(username=username, email=email, role=role, created_by=identity["username"])
    new_admin.set_password(password)
    db.session.add(new_admin)
    db.session.commit()
    return jsonify({"admin": new_admin.to_dict(), "message": "Admin created"}), 201


@app.route("/api/admins/<int:admin_id>", methods=["DELETE"])
@jwt_required()
def delete_admin(admin_id):
    identity = json.loads(get_jwt_identity())
    if identity["role"] != "superadmin":
        return jsonify({"error": "Only superadmins can delete admins"}), 403

    admin = Admin.query.get(admin_id)
    if not admin:
        return jsonify({"error": "Admin not found"}), 404
    if admin.id == identity["id"]:
        return jsonify({"error": "Cannot delete yourself"}), 400

    db.session.delete(admin)
    db.session.commit()
    return jsonify({"message": "Admin deleted"}), 200


# ─────────────────── AI Constraints Route ───────────────────
@app.route("/api/constraints/parse", methods=["POST"])
@jwt_required()
def parse_constraints():
    data = request.get_json()
    admin_text = data.get("text", "").strip()

    if not admin_text:
        return jsonify({"error": "No constraint text provided"}), 400

    constraints, status = parse_admin_constraints(admin_text)

    if status != "OK":
        return jsonify({
            "constraints": constraints,
            "warning": status,
            "ai_used": False,
        }), 200

    return jsonify({
        "constraints": constraints,
        "ai_used": True,
        "status": "Constraints parsed successfully",
    }), 200


# ─────────────────── Allocation Route ───────────────────
@app.route("/api/allocate", methods=["POST"])
@jwt_required()
def allocate():
    identity = json.loads(get_jwt_identity())

    if "students_file" not in request.files or "teachers_file" not in request.files:
        return jsonify({"error": "Both student and teacher CSV files are required"}), 400

    exam_name = request.form.get("exam_name", "Unnamed Exam").strip()
    max_classes = int(request.form.get("max_classes", 20))
    rows = int(request.form.get("rows", 10))
    cols = int(request.form.get("cols", 4))
    min_perfect = int(request.form.get("min_perfect", 30))
    min_good = int(request.form.get("min_good", 20))
    random_seed = int(request.form.get("random_seed", 42))
    shuffle = request.form.get("shuffle_within_dept", "false").lower() == "true"

    # AI constraints — sent as JSON string in form data
    ai_constraints_raw = request.form.get("ai_constraints", "{}")
    try:
        ai_constraints = json.loads(ai_constraints_raw)
    except (json.JSONDecodeError, TypeError):
        ai_constraints = {}

    try:
        students_df = pd.read_csv(request.files["students_file"])
        teachers_df = pd.read_csv(request.files["teachers_file"])
    except Exception as e:
        return jsonify({"error": f"Could not parse CSV files: {str(e)}"}), 400

    if students_df.empty or teachers_df.empty:
        return jsonify({"error": "Uploaded files are empty"}), 400

    try:
        result = generate_seating_plan(
            students_df, teachers_df,
            max_classes=max_classes, rows=rows, cols=cols,
            min_perfect=min_perfect, min_good=min_good,
            random_seed=random_seed, shuffle_within_dept=shuffle,
            ai_constraints=ai_constraints
        )
    except Exception as e:
        return jsonify({"error": f"Algorithm error: {str(e)}"}), 500

    config = {
        "max_classes": max_classes, "rows": rows, "cols": cols,
        "min_perfect": min_perfect, "min_good": min_good,
        "random_seed": random_seed, "shuffle_within_dept": shuffle,
        "ai_constraints": ai_constraints,
    }

    record = ExamRecord(
        exam_name=exam_name,
        created_by=identity["username"],
        total_students=result["metrics"]["total_students"],
        total_rooms=result["metrics"]["total_rooms"],
        room_utilization=result["metrics"]["room_utilization"],
        fairness_index=result["metrics"]["fairness_index"],
        load_variance=result["metrics"]["load_variance"],
        conflict_count=result["metrics"]["conflict_count"],
        config_json=json.dumps(config),
        summary_json=json.dumps(result["summary"]),
        teacher_load_json=json.dumps(result["teacher_load"]),
        excel_data=result["excel_bytes"],
        unallocated_log=json.dumps(result["unallocated_log"]),
    )
    db.session.add(record)
    db.session.commit()

    return jsonify({
        "record_id": record.id,
        "metrics": result["metrics"],
        "summary": result["summary"],
        "teacher_load": result["teacher_load"],
        "unallocated_log": result["unallocated_log"],
        "logs": result["logs"],
        "message": "Seating plan generated successfully",
    }), 200


@app.route("/api/allocate/<int:record_id>/download", methods=["GET"])
@jwt_required()
def download_excel(record_id):
    record = ExamRecord.query.get(record_id)
    if not record:
        return jsonify({"error": "Record not found"}), 404

    return send_file(
        BytesIO(record.excel_data),
        download_name=f"{record.exam_name.replace(' ','_')}_seating_plan.xlsx",
        as_attachment=True,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


# ─────────────────── Records Routes ───────────────────
@app.route("/api/records", methods=["GET"])
@jwt_required()
def list_records():
    records = ExamRecord.query.order_by(ExamRecord.created_at.desc()).all()
    return jsonify({"records": [r.to_dict() for r in records]}), 200


@app.route("/api/records/<int:record_id>", methods=["GET"])
@jwt_required()
def get_record(record_id):
    record = ExamRecord.query.get(record_id)
    if not record:
        return jsonify({"error": "Record not found"}), 404
    return jsonify({"record": record.to_dict()}), 200


@app.route("/api/records/<int:record_id>", methods=["DELETE"])
@jwt_required()
def delete_record(record_id):
    identity = json.loads(get_jwt_identity())
    record = ExamRecord.query.get(record_id)
    if not record:
        return jsonify({"error": "Record not found"}), 404
    if record.created_by != identity["username"] and identity["role"] != "superadmin":
        return jsonify({"error": "Not authorized to delete this record"}), 403
    db.session.delete(record)
    db.session.commit()
    return jsonify({"message": "Record deleted"}), 200


@app.route("/api/dashboard/stats", methods=["GET"])
@jwt_required()
def dashboard_stats():
    records = ExamRecord.query.order_by(ExamRecord.created_at.desc()).all()
    if not records:
        return jsonify({"stats": {
            "total_exams": 0, "avg_utilization": 0,
            "avg_fairness": 0, "total_students_processed": 0,
            "recent_records": []
        }}), 200

    avg_utilization = sum(r.room_utilization or 0 for r in records) / len(records)
    avg_fairness = sum(r.fairness_index or 0 for r in records) / len(records)
    total_students = sum(r.total_students or 0 for r in records)

    recent = [r.to_dict() for r in records[:5]]
    return jsonify({"stats": {
        "total_exams": len(records),
        "avg_utilization": round(avg_utilization, 2),
        "avg_fairness": round(avg_fairness, 2),
        "total_students_processed": total_students,
        "recent_records": recent,
    }}), 200


# ─────────────────── Init DB ───────────────────
def init_db():
    with app.app_context():
        db.create_all()
        if not Admin.query.filter_by(username="superadmin").first():
            sa = Admin(username="superadmin", email="admin@examseating.com", role="superadmin", created_by="system")
            sa.set_password("Admin@1234")
            db.session.add(sa)
            db.session.commit()
            print("✅ Default superadmin created: superadmin / Admin@1234")


if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
