package com.smartclasspulse.app.models;

public class ClassItem {
    private String id;
    private String name;
    private String teacherName;

    public ClassItem() {}

    public ClassItem(String id, String name, String teacherName) {
        this.id = id;
        this.name = name;
        this.teacherName = teacherName;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getTeacherName() { return teacherName; }
}
