package com.smartclasspulse.app.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.firebase.firestore.FirebaseFirestore;
import com.smartclasspulse.app.R;
import com.smartclasspulse.app.adapters.ClassAdapter;
import com.smartclasspulse.app.models.ClassItem;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AdminClassesFragment extends Fragment {

    private EditText classNameEdit;
    private Button createBtn;
    private RecyclerView recyclerView;
    private ClassAdapter adapter;
    private List<ClassItem> classList = new ArrayList<>();
    private FirebaseFirestore db;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_admin_classes, container, false);

        classNameEdit = view.findViewById(R.id.newClassNameEdit);
        createBtn = view.findViewById(R.id.createClassBtn);
        recyclerView = view.findViewById(R.id.adminClassesRecyclerView);
        
        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        adapter = new ClassAdapter(classList);
        recyclerView.setAdapter(adapter);

        db = FirebaseFirestore.getInstance();

        createBtn.setOnClickListener(v -> createClass());

        loadClasses();

        return view;
    }

    private void createClass() {
        String name = classNameEdit.getText().toString().trim();
        if (name.isEmpty()) return;

        Map<String, Object> newClass = new HashMap<>();
        newClass.put("name", name);
        newClass.put("teacherId", "admin_assigned");
        newClass.put("teacherName", "Admin");
        newClass.put("students", new ArrayList<>());
        newClass.put("createdAt", new java.util.Date().toString());

        db.collection("classes")
                .add(newClass)
                .addOnSuccessListener(documentReference -> {
                    classNameEdit.setText("");
                    Toast.makeText(getContext(), "Class Created!", Toast.LENGTH_SHORT).show();
                });
    }

    private void loadClasses() {
        db.collection("classes")
                .addSnapshotListener((value, error) -> {
                    if (error != null || value == null) return;
                    classList.clear();
                    classList.addAll(value.toObjects(ClassItem.class));
                    adapter.notifyDataSetChanged();
                });
    }
}
