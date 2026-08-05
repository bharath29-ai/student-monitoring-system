package com.smartclasspulse.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Filter;
import android.widget.Filterable;
import android.widget.ImageButton;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.smartclasspulse.app.R;
import com.smartclasspulse.app.models.StudentItem;
import java.util.ArrayList;
import java.util.List;

public class StudentAdapter extends RecyclerView.Adapter<StudentAdapter.ViewHolder> implements Filterable {

    private List<StudentItem> students;
    private List<StudentItem> studentsFiltered;
    private OnStudentActionListener listener;
    private boolean isAdmin = false;

    public interface OnStudentActionListener {
        void onDelete(String studentId);
    }

    public StudentAdapter(List<StudentItem> students) {
        this.students = students;
        this.studentsFiltered = students;
    }

    public void setListener(OnStudentActionListener listener) {
        this.listener = listener;
    }

    public void setAdmin(boolean admin) {
        this.isAdmin = admin;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_student, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        StudentItem item = studentsFiltered.get(position);
        holder.nameText.setText(item.getStudentName());
        holder.statusText.setText(item.getStatus());
        holder.scoreText.setText(item.getScore() + "%");
        
        // Change color based on status
        int color = 0xFF4CAF50; // Green
        if ("distracted".equalsIgnoreCase(item.getStatus())) color = 0xFFFF9800; // Orange
        else if ("sleepy".equalsIgnoreCase(item.getStatus())) color = 0xFFF44336; // Red
        
        holder.statusText.setTextColor(color);

        holder.deleteBtn.setVisibility(isAdmin ? View.VISIBLE : View.GONE);
        holder.deleteBtn.setOnClickListener(v -> {
            if (listener != null) {
                listener.onDelete(item.getStudentId());
            }
        });
    }

    @Override
    public int getItemCount() {
        return studentsFiltered.size();
    }

    @Override
    public Filter getFilter() {
        return new Filter() {
            @Override
            protected FilterResults performFiltering(CharSequence constraint) {
                String charString = constraint.toString();
                if (charString.isEmpty()) {
                    studentsFiltered = students;
                } else {
                    List<StudentItem> filteredList = new ArrayList<>();
                    for (StudentItem row : students) {
                        if (row.getStudentName().toLowerCase().contains(charString.toLowerCase())) {
                            filteredList.add(row);
                        }
                    }
                    studentsFiltered = filteredList;
                }

                FilterResults filterResults = new FilterResults();
                filterResults.values = studentsFiltered;
                return filterResults;
            }

            @Override
            protected void publishResults(CharSequence constraint, FilterResults results) {
                studentsFiltered = (ArrayList<StudentItem>) results.values;
                notifyDataSetChanged();
            }
        };
    }

    class ViewHolder extends RecyclerView.ViewHolder {
        TextView nameText, statusText, scoreText;
        ImageButton deleteBtn;

        ViewHolder(View view) {
            super(view);
            nameText = view.findViewById(R.id.studentName);
            statusText = view.findViewById(R.id.studentStatus);
            scoreText = view.findViewById(R.id.studentScore);
            deleteBtn = view.findViewById(R.id.deleteStudentBtn);
        }
    }
}
