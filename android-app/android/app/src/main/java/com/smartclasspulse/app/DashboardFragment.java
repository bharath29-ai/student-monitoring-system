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
import com.smartclasspulse.app.models.ClassItem;
import com.smartclasspulse.app.adapters.ClassAdapter;

import java.util.ArrayList;
import java.util.List;

public class DashboardFragment extends Fragment {

    private TextView welcomeText, subtitleText;
    private View statsGrid, studentClassesView, availableClassesView;
    private TextView totalStudentsText, attentiveText, distractedText, sleepyText;
    private RecyclerView recyclerView, availableRecyclerView;
    private FirebaseFirestore db;
    private UserSession session;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_dashboard, container, false);
        
        welcomeText = view.findViewById(R.id.welcomeText);
        subtitleText = view.findViewById(R.id.subtitleText);
        statsGrid = view.findViewById(R.id.statsGrid);
        studentClassesView = view.findViewById(R.id.studentClassesView);
        availableClassesView = view.findViewById(R.id.availableClassesView);
        
        totalStudentsText = view.findViewById(R.id.totalStudentsText);
        attentiveText = view.findViewById(R.id.attentiveText);
        distractedText = view.findViewById(R.id.distractedText);
        sleepyText = view.findViewById(R.id.sleepyText);
        
        recyclerView = view.findViewById(R.id.classesRecyclerView);
        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));

        availableRecyclerView = view.findViewById(R.id.availableClassesRecyclerView);
        availableRecyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        
        db = FirebaseFirestore.getInstance();
        session = new UserSession(getContext());
        
        welcomeText.setText("Hello, " + session.getUserName() + "!");
        
        if ("student".equals(session.getUserRole())) {
            statsGrid.setVisibility(View.GONE);
            studentClassesView.setVisibility(View.VISIBLE);
            availableClassesView.setVisibility(View.VISIBLE);
            subtitleText.setText("Let's check your enrolled attention feeds");
            loadEnrolledClasses();
            loadAvailableClasses();
        } else {
            statsGrid.setVisibility(View.VISIBLE);
            studentClassesView.setVisibility(View.GONE);
            availableClassesView.setVisibility(View.GONE);
            subtitleText.setText("Real-time classroom engagement overview");
            loadClassroomStats();
        }
        
        return view;
    }

    private void loadAvailableClasses() {
        db.collection("classes")
                .addSnapshotListener((value, error) -> {
                    if (error != null || value == null) return;
                    List<ClassItem> available = new ArrayList<>();
                    String myId = session.getUserId();
                    for (com.google.firebase.firestore.QueryDocumentSnapshot doc : value) {
                        ClassItem item = doc.toObject(ClassItem.class);
                        item.setId(doc.getId());
                        if (item.getStudents() == null || !item.getStudents().contains(myId)) {
                            available.add(item);
                        }
                    }
                    availableRecyclerView.setAdapter(new com.smartclasspulse.app.adapters.ClassAdapter(available));
                });
    }

    private void loadClassroomStats() {
        // In a real app, this would be a specialized aggregation query
        db.collection("reports")
                .addSnapshotListener((value, error) -> {
                    if (error != null || value == null) return;
                    
                    int total = 0, attentive = 0, distracted = 0, sleepy = 0;
                    // Logic to count latest status
                    // For demo, just counting all reports in last hour or similar
                    total = value.size();
                    for (com.google.firebase.firestore.QueryDocumentSnapshot doc : value) {
                        String status = doc.getString("status");
                        if ("attentive".equalsIgnoreCase(status)) attentive++;
                        else if ("distracted".equalsIgnoreCase(status)) distracted++;
                        else if ("sleepy".equalsIgnoreCase(status)) sleepy++;
                    }
                    
                    totalStudentsText.setText(String.valueOf(total));
                    attentiveText.setText(String.valueOf(attentive));
                    distractedText.setText(String.valueOf(distracted));
                    sleepyText.setText(String.valueOf(sleepy));
                });
    }

    private void loadEnrolledClasses() {
        if (session.getUserId() == null) return;

        db.collection("classes")
                .whereArrayContains("students", session.getUserId())
                .get()
                .addOnSuccessListener(queryDocumentSnapshots -> {
                    List<ClassItem> classes = new ArrayList<>();
                    for (QueryDocumentSnapshot doc : queryDocumentSnapshots) {
                        classes.add(doc.toObject(ClassItem.class));
                    }
                    recyclerView.setAdapter(new ClassAdapter(classes));
                });
    }
}
