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

public class ReportsFragment extends Fragment {

    private RecyclerView recyclerView;
    private FirebaseFirestore db;
    private UserSession session;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_reports, container, false);
        
        recyclerView = view.findViewById(R.id.reportsRecyclerView);
        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        
        db = FirebaseFirestore.getInstance();
        session = new UserSession(getContext());
        
        loadReports();
        
        return view;
    }

    private void loadReports() {
        if (session.getUserId() == null) return;

        com.google.firebase.firestore.Query query;
        if ("student".equals(session.getUserRole())) {
            query = db.collection("reports")
                    .whereEqualTo("studentId", session.getUserId());
        } else {
            // Teachers see all reports for classes they manage or all reports for now
            query = db.collection("reports");
        }

        query.orderBy("timestamp", com.google.firebase.firestore.Query.Direction.DESCENDING)
                .get()
                .addOnSuccessListener(queryDocumentSnapshots -> {
                    List<ReportItem> reports = queryDocumentSnapshots.toObjects(ReportItem.class);
                    recyclerView.setAdapter(new ReportAdapter(reports));
                });
    }
}
