variable "state_bucket_name" {
  type        = string
  default     = "borderless-hms-terraform-state-600627355607"
  description = "Globally unique S3 bucket name for Terraform state"
}

variable "aws_region" {
  type    = string
  default = "eu-north-1"
}

variable "aws_account_id" {
  type    = string
  default = "600627355607"
}

variable "project_name" {
  type    = string
  default = "borderless-hms"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "postgres_password" {
  type      = string
  sensitive = true
}

variable "jwt_secret_key" {
  type      = string
  sensitive = true
}

variable "rds_instance_class" {
  type    = string
  default = "db.t3.medium"
}

variable "rds_multi_az" {
  type    = bool
  default = false
}

variable "backend_min_tasks" {
  type    = number
  default = 2
}

variable "backend_max_tasks" {
  type    = number
  default = 20
}

variable "frontend_min_tasks" {
  type    = number
  default = 2
}

variable "frontend_max_tasks" {
  type    = number
  default = 10
}
