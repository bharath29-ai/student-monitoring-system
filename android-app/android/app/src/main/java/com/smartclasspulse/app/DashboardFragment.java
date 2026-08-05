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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
        String teacherId = session.getUserId();
        
        // 1. Get total assigned students
        db.collection("users")
                .whereEqualTo("role", "student")
                .whereEqualTo("teacherId", teacherId)
                .addSnapshotListener((userSnap, userErr) -> {
                    if (userErr != null || userSnap == null) return;
                    int totalAssigned = userSnap.size();
                    totalStudentsText.setText(String.valueOf(totalAssigned));
                });

        // 2. Get active statuses from reports (latest per student)
        db.collection("reports")
                .whereEqualTo("teacherId", teacherId)
                .orderBy("timestamp", com.google.firebase.firestore.Query.Direction.DESCENDING)
                .limit(100)
                .addSnapshotListener((value, error) -> {
                    if (error != null || value == null) return;
                    
                    int attentive = 0, distracted = 0, sleepy = 0;
                    Map<String, String> studentLatestStatus = new HashMap<>();
                    
                    long nowMs = System.currentTimeMillis();
                    long STALE_THRESHOLD = 30000; // 30 seconds

                    for (com.google.firebase.firestore.QueryDocumentSnapshot doc : value) {
                        String sId = doc.getString("studentId");
                        String status = doc.getString("status");
                        com.google.firebase.Timestamp timestamp = doc.getTimestamp("timestamp");
                        
                        if (sId != null && status != null && timestamp != null) {
                            if (nowMs - timestamp.toDate().getTime() < STALE_THRESHOLD) {
                                if (!studentLatestStatus.containsKey(sId)) {
                                    studentLatestStatus.put(sId, status);
                                }
                            }
                        }
                    }
                    
                    for (String status : studentLatestStatus.values()) {
                        if ("attentive".equalsIgnoreCase(status)) attentive++;
                        else if ("distracted".equalsIgnoreCase(status)) distracted++;
                        else if ("sleepy".equalsIgnoreCase(status)) sleepy++;
                    }
                    
                    attentiveText.setText(String.valueOf(attentive));
                    distractedText.setText(String.valueOf(distracted));
                    sleepyText.setText(String.valueOf(sleepy));
                });
    }

    private void loadEnrolledClasses() {
        if (session.getUserId() == null) return;

        db.collection("classes")
                .whereArrayContains("students", session.getUserId())
                .addSnapshotListener((queryDocumentSnapshots, error) -> {
                    if (error != null || queryDocumentSnapshots == null) return;
                    List<ClassItem> classes = new ArrayList<>();
                    for (QueryDocumentSnapshot doc : queryDocumentSnapshots) {
                        ClassItem item = doc.toObject(ClassItem.class);
                        item.setId(doc.getId());
                        classes.add(item);
                    }
                    recyclerView.setAdapter(new ClassAdapter(classes));
                });
    }
}
