package com.smartclasspulse.app;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.QueryDocumentSnapshot;

import java.util.ArrayList;
import java.util.List;

public class DashboardFragment extends Fragment {

    private TextView welcomeText;
    private RecyclerView recyclerView;
    private FirebaseFirestore db;
    private UserSession session;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_dashboard, container, false);
        
        welcomeText = view.findViewById(R.id.welcomeText);
        recyclerView = view.findViewById(R.id.classesRecyclerView);
        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        
        db = FirebaseFirestore.getInstance();
        session = new UserSession(getContext());
        
        welcomeText.setText("Hello, " + session.getUserName() + "!");
        
        loadEnrolledClasses();
        
        return view;
    }

    private void loadEnrolledClasses() {
        if (session.getUserId() == null) return;

        db.collection("classes")
                .whereArrayContains("students", session.getUserId())
                .get()
                .addOnSuccessListener(queryDocumentSnapshots -> {
                    // Logic to populate list
                });
    }
}
