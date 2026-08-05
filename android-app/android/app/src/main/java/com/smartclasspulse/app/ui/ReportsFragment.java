package com.smartclasspulse.app.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.smartclasspulse.app.R;
import com.smartclasspulse.app.UserSession;
import com.smartclasspulse.app.models.ReportItem;
import com.smartclasspulse.app.adapters.ReportAdapter;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.Query;

import java.util.ArrayList;
import java.util.List;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.pdf.PdfDocument;
import android.os.Environment;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

public class ReportsFragment extends Fragment {

    private RecyclerView recyclerView;
    private FirebaseFirestore db;
    private UserSession session;
    private List<ReportItem> currentReports = new ArrayList<>();

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_reports, container, false);
        
        recyclerView = view.findViewById(R.id.reportsRecyclerView);
        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        
        db = FirebaseFirestore.getInstance();
        session = new UserSession(getContext());
        
        view.findViewById(R.id.exportPdfFab).setOnClickListener(v -> exportToPdf());

        loadReports();
        
        return view;
    }

    private void loadReports() {
        if (session.getUserId() == null) return;

        com.google.firebase.firestore.Query query;
        if ("student".equals(session.getUserRole())) {
            query = db.collection("reports")
                    .whereEqualTo("studentId", session.getUserId());
        } else if ("teacher".equals(session.getUserRole())) {
            query = db.collection("reports")
                    .whereEqualTo("teacherId", session.getUserId());
        } else {
            // Admins can see all
            query = db.collection("reports");
        }

        query.orderBy("timestamp", com.google.firebase.firestore.Query.Direction.DESCENDING)
                .addSnapshotListener((value, error) -> {
                    if (error != null || value == null) return;
                    currentReports = value.toObjects(ReportItem.class);
                    recyclerView.setAdapter(new ReportAdapter(currentReports));
                });
    }

    private void exportToPdf() {
        if (currentReports.isEmpty()) {
            Toast.makeText(getContext(), "No data to export", Toast.LENGTH_SHORT).show();
            return;
        }

        PdfDocument pdfDocument = new PdfDocument();
        Paint paint = new Paint();
        PdfDocument.PageInfo pageInfo = new PdfDocument.PageInfo.Builder(595, 842, 1).create();
        PdfDocument.Page page = pdfDocument.startPage(pageInfo);
        Canvas canvas = page.getCanvas();

        paint.setTextSize(18);
        paint.setFakeBoldText(true);
        canvas.drawText("Smart Class Pulse - Attendance Report", 50, 50, paint);

        paint.setTextSize(12);
        paint.setFakeBoldText(false);
        int y = 100;
        
        canvas.drawText("Generated on: " + new java.util.Date().toString(), 50, y, paint);
        y += 30;

        for (ReportItem report : currentReports) {
            if (y > 800) {
                pdfDocument.finishPage(page);
                pageInfo = new PdfDocument.PageInfo.Builder(595, 842, pdfDocument.getPages().size() + 1).create();
                page = pdfDocument.startPage(pageInfo);
                canvas = page.getCanvas();
                y = 50;
            }
            
            String line = (report.getTimestamp() != null ? report.getTimestamp().toDate().toString() : "N/A") + 
                         " | " + report.getStudentName() + 
                         " | Status: " + report.getStatus();
            canvas.drawText(line, 50, y, paint);
            y += 20;
        }

        pdfDocument.finishPage(page);

        File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        File file = new File(downloadsDir, "SmartClassPulse_Report_" + System.currentTimeMillis() + ".pdf");

        try {
            pdfDocument.writeTo(new FileOutputStream(file));
            Toast.makeText(getContext(), "Report saved to Downloads", Toast.LENGTH_LONG).show();
        } catch (IOException e) {
            Toast.makeText(getContext(), "Export failed: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }

        pdfDocument.close();
    }
}
