package com.smartclasspulse.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.smartclasspulse.app.R;
import com.smartclasspulse.app.models.ClassItem;
import com.google.firebase.firestore.FieldValue;
import com.google.firebase.firestore.FirebaseFirestore;
import com.smartclasspulse.app.UserSession;
import java.util.List;

public class ClassAdapter extends RecyclerView.Adapter<ClassAdapter.ViewHolder> {
    private List<ClassItem> classes;

    public ClassAdapter(List<ClassItem> classes) {
        this.classes = classes;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_class, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        ClassItem item = classes.get(position);
        holder.nameText.setText(item.getName());
        holder.teacherText.setText("Teacher: " + item.getTeacherName());
        
        holder.itemView.setOnClickListener(v -> {
            UserSession session = new UserSession(v.getContext());
            String studentId = session.getUserId();
            
            if (studentId == null) return;
            if (item.getId() == null) {
                android.widget.Toast.makeText(v.getContext(), "Error: Class ID is missing", android.widget.Toast.LENGTH_SHORT).show();
                return;
            }

            // If already enrolled, don't re-enroll
            if (item.getStudents() != null && item.getStudents().contains(studentId)) {
                android.widget.Toast.makeText(v.getContext(), "You are already enrolled in " + item.getName(), android.widget.Toast.LENGTH_SHORT).show();
                return;
            }

            FirebaseFirestore db = FirebaseFirestore.getInstance();
            
            // 1. Add student to the class list
            db.collection("classes").document(item.getId())
                    .update("students", FieldValue.arrayUnion(studentId))
                    .addOnSuccessListener(aVoid -> {
                        // 2. Link student to this teacher in their profile
                        db.collection("users").document(studentId)
                                .update("teacherId", item.getTeacherId())
                                .addOnSuccessListener(aVoid2 -> {
                                    android.widget.Toast.makeText(v.getContext(), "Enrolled in " + item.getName(), android.widget.Toast.LENGTH_SHORT).show();
                                });
                    })
                    .addOnFailureListener(e -> {
                        android.widget.Toast.makeText(v.getContext(), "Enrollment failed: " + e.getMessage(), android.widget.Toast.LENGTH_SHORT).show();
                    });
        });
    }

    @Override
    public int getItemCount() {
        return classes.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView nameText, teacherText;
        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            nameText = itemView.findViewById(R.id.classNameText);
            teacherText = itemView.findViewById(R.id.teacherNameText);
        }
    }
}
