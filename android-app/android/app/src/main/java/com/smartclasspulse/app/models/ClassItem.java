package com.smartclasspulse.app.models;

import java.util.List;

public class ClassItem {
    private String id;
    private String name;
    private String teacherId;
    private String teacherName;
    private List<String> students;

    public ClassItem() {}

    public ClassItem(String id, String name, String teacherName) {
        this.id = id;
        this.name = name;
        this.teacherName = teacherName;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getTeacherId() { return teacherId; }
    public void setTeacherId(String teacherId) { this.teacherId = teacherId; }
    
    public String getTeacherName() { return teacherName; }
    public void setTeacherName(String teacherName) { this.teacherName = teacherName; }
    
    public List<String> getStudents() { return students; }
    public void setStudents(List<String> students) { this.students = students; }
}
