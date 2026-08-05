package com.smartclasspulse.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.smartclasspulse.app.R;
import com.smartclasspulse.app.models.ReportItem;
import java.util.List;

public class ReportAdapter extends RecyclerView.Adapter<ReportAdapter.ViewHolder> {
    private List<ReportItem> reports;

    public ReportAdapter(List<ReportItem> reports) {
        this.reports = reports;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_report, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        ReportItem item = reports.get(position);
        holder.nameText.setText(item.getStudentName() != null ? item.getStudentName() : "Student");
        holder.classText.setText(item.getClassName() != null ? item.getClassName() : "General");
        
        String status = item.getStatus() != null ? item.getStatus().toUpperCase() : "UNKNOWN";
        holder.statusText.setText(status);
        holder.scoreText.setText(item.getScore() + "%");
        holder.obsText.setText(item.getObservations());
        
        if (item.getTimestamp() != null) {
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("MMM dd, HH:mm", java.util.Locale.getDefault());
            holder.dateText.setText(sdf.format(item.getTimestamp().toDate()));
        } else {
            holder.dateText.setText("");
        }

        int color = 0xFF4CAF50; // Attentive Green
        if ("SLEEPY".equalsIgnoreCase(status)) color = 0xFFF44336; // Red
        else if ("DISTRACTED".equalsIgnoreCase(status)) color = 0xFFFF9800; // Orange

        holder.statusText.setTextColor(color);
    }

    @Override
    public int getItemCount() {
        return reports.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView nameText, statusText, scoreText, dateText, obsText, classText;
        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            nameText = itemView.findViewById(R.id.reportStudentName);
            classText = itemView.findViewById(R.id.reportClassName);
            statusText = itemView.findViewById(R.id.reportStatusText);
            scoreText = itemView.findViewById(R.id.reportScoreText);
            dateText = itemView.findViewById(R.id.reportDateText);
            obsText = itemView.findViewById(R.id.reportObservations);
        }
    }
}
