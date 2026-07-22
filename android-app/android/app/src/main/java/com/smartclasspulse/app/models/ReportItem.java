package com.smartclasspulse.app.models;

import com.google.firebase.Timestamp;

public class ReportItem {
    private String status;
    private int score;
    private String observations;
    private Timestamp timestamp;

    public ReportItem() {}

    public String getStatus() { return status; }
    public int getScore() { return score; }
    public String getObservations() { return observations; }
    public Timestamp getTimestamp() { return timestamp; }
}
