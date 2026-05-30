variable "project_name" { type = string }
variable "environment" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "db_security_group_id" { type = string }
variable "postgres_password" {
  type      = string
  sensitive = true
}
variable "rds_instance_class" { type = string }
variable "rds_multi_az" { type = bool }
