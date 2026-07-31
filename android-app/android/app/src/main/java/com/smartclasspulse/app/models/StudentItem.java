package com.smartclasspulse.app.models;

import com.google.firebase.Timestamp;

public class StudentItem {
    private String studentId;
    private String studentName;
    private String status;
    private int score;
    private String observations;
    private Timestamp timestamp;

    public StudentItem() {}

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public String getObservations() { return observations; }
    public void setObservations(String observations) { this.observations = observations; }

    public Timestamp getTimestamp() { return timestamp; }
    public void setTimestamp(Timestamp timestamp) { this.timestamp = timestamp; }
}
