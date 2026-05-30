resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-db-subnet-group"
  subnet_ids = var.private_subnet_ids
}

resource "aws_db_instance" "main" {
  identifier        = "${var.project_name}-${var.environment}-db"
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = var.rds_instance_class
  allocated_storage = 20
  storage_encrypted = true

  db_name  = "hospital_db"
  username = "postgres"
  password = var.postgres_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.db_security_group_id]

  iam_database_authentication_enabled = true
  multi_az               = var.rds_multi_az
  skip_final_snapshot    = false
  final_snapshot_identifier = "${var.project_name}-${var.environment}-final-snapshot"
  backup_retention_period = 7
  deletion_protection    = true
}
