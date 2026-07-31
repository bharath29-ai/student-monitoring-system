package com.smartclasspulse.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.smartclasspulse.app.R;
import com.smartclasspulse.app.models.UserItem;
import java.util.List;

public class ApprovalAdapter extends RecyclerView.Adapter<ApprovalAdapter.ViewHolder> {

    private List<UserItem> users;
    private OnApprovalActionListener listener;

    public interface OnApprovalActionListener {
        void onAction(String userId, String status);
    }

    public ApprovalAdapter(List<UserItem> users, OnApprovalActionListener listener) {
        this.users = users;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_approval, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        UserItem user = users.get(position);
        holder.nameText.setText(user.getName());
        holder.emailText.setText(user.getEmail());
        holder.roleText.setText(user.getRole());

        holder.approveBtn.setOnClickListener(v -> listener.onAction(user.getId(), "approved"));
        holder.rejectBtn.setOnClickListener(v -> listener.onAction(user.getId(), "rejected"));
    }

    @Override
    public int getItemCount() {
        return users.size();
    }

    class ViewHolder extends RecyclerView.ViewHolder {
        TextView nameText, emailText, roleText;
        Button approveBtn, rejectBtn;

        ViewHolder(View view) {
            super(view);
            nameText = view.findViewById(R.id.approvalName);
            emailText = view.findViewById(R.id.approvalEmail);
            roleText = view.findViewById(R.id.approvalRole);
            approveBtn = view.findViewById(R.id.approveButton);
            rejectBtn = view.findViewById(R.id.rejectButton);
        }
    }
}
