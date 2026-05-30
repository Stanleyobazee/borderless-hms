output "log_group_backend" {
  value = aws_cloudwatch_log_group.backend.name
}

output "log_group_frontend" {
  value = aws_cloudwatch_log_group.frontend.name
}
