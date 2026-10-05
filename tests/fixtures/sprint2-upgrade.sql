INSERT INTO roles (id,code,name,updated_at) VALUES (1,'HISTORICAL','Historical',NOW(3));
INSERT INTO users (id,email,password_hash,full_name,role_id,updated_at)
VALUES (1,'history@scms.test','fixture-only','Historical Person',1,NOW(3));
INSERT INTO membership_plans (id,code,name,duration_days,price,updated_at)
VALUES (1,'HISTORY','Historical Plan',30,100,NOW(3));
INSERT INTO memberships (id,user_id,active_user_id,plan_id,start_date,end_date,updated_at)
VALUES (1,1,1,1,'2026-01-01','2026-02-01',NOW(3));
INSERT INTO invoices (id,code,user_id,plan_id,membership_id,amount,expires_at,updated_at)
VALUES (1,'HISTORY-1',1,1,1,100,'2026-01-02',NOW(3));
INSERT INTO notifications (user_id,membership_id,kind,title,message)
VALUES (1,1,'MEMBERSHIP_EXPIRY_REMINDER','History','Keep this notification');
INSERT INTO subjects (id,name,updated_at) VALUES (1,'Historical Subject',NOW(3));
INSERT INTO rooms (id,name,capacity,updated_at) VALUES (1,'Historical Room',10,NOW(3));
INSERT INTO gym_classes (id,name,subject_id,room_id,coach_id,capacity,starts_on,ends_on,
  weekly_schedule,registration_start_at,registration_end_at,updated_at)
VALUES (1,'Historical Class',1,1,1,10,'2026-01-01','2026-01-31','[]','2025-12-01','2026-01-01',NOW(3));
INSERT INTO class_sessions (id,class_id,start_at,end_at,status,updated_at)
VALUES (1,1,'2026-01-05 11:00','2026-01-05 12:00','COMPLETED',NOW(3));
INSERT INTO enrollments (id,session_id,user_id,updated_at) VALUES (1,1,1,NOW(3));
INSERT INTO attendances (session_id,enrollment_id,member_id,marked_by_id,status,updated_at)
VALUES (1,1,1,1,'PRESENT',NOW(3));
INSERT INTO check_ins (member_id,session_id,kind,code,created_by_id)
VALUES (1,1,'CLASS','historical-scan',1);
INSERT INTO payments (invoice_id,provider,requested_amount,received_amount,paid_at,actor_id)
VALUES (1,'COUNTER',100,100,NOW(3),1);
INSERT INTO payment_webhook_logs (provider_transaction_id,invoice_code,status,payload,invoice_id)
VALUES ('historical-payment','HISTORY-1','PROCESSED','{"keep":true}',1);
INSERT INTO training_plans (id,member_id,coach_id,title,status,updated_at)
VALUES (1,1,1,'Historical Plan','PUBLISHED',NOW(3));
INSERT INTO training_exercises (id,plan_id,name,sets,repetitions,`order`,updated_at)
VALUES (1,1,'Historical exercise',3,'10',1,NOW(3));
INSERT INTO exercise_completions (exercise_id,member_id) VALUES (1,1);
INSERT INTO training_results (member_id,coach_id,session_id,plan_id,comment,updated_at)
VALUES (1,1,1,1,'Keep this historical result',NOW(3));
