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

import com.google.firebase.firestore.FirebaseFirestore;
import com.smartclasspulse.app.R;
import com.smartclasspulse.app.adapters.ApprovalAdapter;
import com.smartclasspulse.app.models.UserItem;

import java.util.ArrayList;
import java.util.List;

public class AdminApprovalsFragment extends Fragment {

    private RecyclerView recyclerView;
    private ApprovalAdapter adapter;
    private List<UserItem> pendingUsers = new ArrayList<>();
    private FirebaseFirestore db;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_admin_approvals, container, false);
        
        recyclerView = view.findViewById(R.id.approvalsRecyclerView);
        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        
        db = FirebaseFirestore.getInstance();
        adapter = new ApprovalAdapter(pendingUsers, (userId, status) -> {
            db.collection("users").document(userId).update("status", status);
        });
        recyclerView.setAdapter(adapter);
        
        loadPendingUsers();
        
        return view;
    }

    private void loadPendingUsers() {
        db.collection("users")
                .whereEqualTo("status", "pending")
                .addSnapshotListener((value, error) -> {
                    if (error != null || value == null) return;
                    pendingUsers.clear();
                    pendingUsers.addAll(value.toObjects(UserItem.class));
                    // Map document ID to model
                    for (int i = 0; i < value.size(); i++) {
                        pendingUsers.get(i).setId(value.getDocuments().get(i).getId());
                    }
                    adapter.notifyDataSetChanged();
                });
    }
}
