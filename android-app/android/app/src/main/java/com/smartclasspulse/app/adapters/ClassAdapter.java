package com.smartclasspulse.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.smartclasspulse.app.R;
import com.smartclasspulse.app.models.ClassItem;
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
            android.widget.Toast.makeText(v.getContext(), "Selected: " + item.getName(), android.widget.Toast.LENGTH_SHORT).show();
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
