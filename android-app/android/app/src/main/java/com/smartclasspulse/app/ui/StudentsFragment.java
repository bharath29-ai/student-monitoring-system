package com.smartclasspulse.app.ui;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.Query;
import com.smartclasspulse.app.R;
import com.smartclasspulse.app.adapters.StudentAdapter;
import com.smartclasspulse.app.models.StudentItem;

import java.util.ArrayList;
import java.util.List;

public class StudentsFragment extends Fragment {

    private RecyclerView recyclerView;
    private StudentAdapter adapter;
    private List<StudentItem> studentList = new ArrayList<>();
    private FirebaseFirestore db;
    private TextView attentiveCount, distractedCount, sleepyCount;
    private EditText searchEdit;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_students, container, false);

        recyclerView = view.findViewById(R.id.studentsRecyclerView);
        attentiveCount = view.findViewById(R.id.attentiveCount);
        distractedCount = view.findViewById(R.id.distractedCount);
        sleepyCount = view.findViewById(R.id.sleepyCount);
        searchEdit = view.findViewById(R.id.searchEditText);

        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        adapter = new StudentAdapter(studentList);
        recyclerView.setAdapter(adapter);

        db = FirebaseFirestore.getInstance();

        loadStudents();
        setupSearch();

        return view;
    }

    private void loadStudents() {
        db.collection("reports")
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .addSnapshotListener((value, error) -> {
                    if (error != null || value == null) return;
                    
                    // Logic to aggregate latest status per student
                    // and update counts + list
                    updateStudentList(value.toObjects(StudentItem.class));
                });
    }

    private void updateStudentList(List<StudentItem> reports) {
        // Simple aggregation logic for now
        studentList.clear();
        studentList.addAll(reports); // In real app, filter for latest per student
        adapter.notifyDataSetChanged();
        
        int attentive = 0, distracted = 0, sleepy = 0;
        for (StudentItem item : reports) {
            if ("attentive".equalsIgnoreCase(item.getStatus())) attentive++;
            else if ("distracted".equalsIgnoreCase(item.getStatus())) distracted++;
            else if ("sleepy".equalsIgnoreCase(item.getStatus())) sleepy++;
        }
        
        attentiveCount.setText(attentive + " Attentive");
        distractedCount.setText(distracted + " Distracted");
        sleepyCount.setText(sleepy + " Sleepy");
    }

    private void setupSearch() {
        searchEdit.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                adapter.getFilter().filter(s);
            }
            @Override
            public void afterTextChanged(Editable s) {}
        });
    }
}
