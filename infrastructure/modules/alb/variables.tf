variable "project_name" { type = string }
variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "public_subnet_ids" { type = list(string) }
variable "alb_sg_id" { type = string }
variable "certificate_arn" {
  type    = string
  default = ""
  description = "ACM certificate ARN for HTTPS. Leave empty to use HTTP only (not recommended for production)"
}
