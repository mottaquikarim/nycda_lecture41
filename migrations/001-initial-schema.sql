-- UP
CREATE TABLE employee(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);
CREATE table dept(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);
CREATE table employee_dept(
    user_id INTEGER NOT NULL,
    dept_id INTEGER NOT NULL
);

INSERT into employee (name) VALUES ('taq');
INSERT into employee (name) VALUES ('baba');
INSERT into employee (name) VALUES ('fizal');
INSERT into employee (name) VALUES ('liza');
INSERT into employee (name) VALUES ('nicole');

INSERT into dept (name) VALUES ('consultant');
INSERT into dept (name) VALUES ('staff');

INSERT into employee_dept (user_id, dept_id) VALUES (1, 1);

INSERT into employee_dept (user_id, dept_id) VALUES (2, 1);

INSERT into employee_dept (user_id, dept_id) VALUES (3, 1);
INSERT into employee_dept (user_id, dept_id) VALUES (3, 2); 

INSERT into employee_dept (user_id, dept_id) VALUES (4, 2);

INSERT into employee_dept (user_id, dept_id) VALUES (5, 1);

-- DOWN

DROP TABLE employee;
DROP TABLE dept;
DROP TABLE employee_dept;
