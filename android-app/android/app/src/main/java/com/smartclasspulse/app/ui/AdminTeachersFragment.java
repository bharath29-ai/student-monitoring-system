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

import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;
import com.smartclasspulse.app.R;
import com.smartclasspulse.app.adapters.ApprovalAdapter;
import com.smartclasspulse.app.models.UserItem;

import java.util.ArrayList;
import java.util.List;

public class AdminTeachersFragment extends Fragment {

    private RecyclerView recyclerView;
    private ApprovalAdapter adapter;
    private List<UserItem> teacherList = new ArrayList<>();
    private FirebaseFirestore db;
    private EditText searchEdit;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_admin_approvals, container, false);
        
        TextView titleText = view.findViewById(R.id.approvalsTitle); // Need to add ID to XML
        if (titleText != null) titleText.setText("Manage Teachers");

        recyclerView = view.findViewById(R.id.approvalsRecyclerView);
        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        
        db = FirebaseFirestore.getInstance();
        adapter = new ApprovalAdapter(teacherList, (userId, status) -> {
            db.collection("users").document(userId)
                    .update("status", status)
                    .addOnSuccessListener(aVoid -> {
                        String msg = "approved".equals(status) ? "Teacher approved" : "Teacher rejected";
                        android.widget.Toast.makeText(getContext(), msg, android.widget.Toast.LENGTH_SHORT).show();
                    })
                    .addOnFailureListener(e -> {
                        android.widget.Toast.makeText(getContext(), "Error: " + e.getMessage(), android.widget.Toast.LENGTH_LONG).show();
                    });
        });
        recyclerView.setAdapter(adapter);
        
        loadTeachers();
        
        return view;
    }

    private void loadTeachers() {
        db.collection("users")
                .whereEqualTo("role", "teacher")
                .whereEqualTo("status", "approved")
                .addSnapshotListener((value, error) -> {
                    if (error != null || value == null) return;
                    teacherList.clear();
                    for (DocumentSnapshot doc : value.getDocuments()) {
                        UserItem item = doc.toObject(UserItem.class);
                        if (item != null) {
                            item.setId(doc.getId());
                            teacherList.add(item);
                        }
                    }
                    adapter.notifyDataSetChanged();
                });
    }
}
