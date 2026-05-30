data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

resource "aws_kms_key" "cloudwatch" {
  description             = "KMS key for CloudWatch log encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.project_name}-${var.environment}/backend"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.cloudwatch.arn
  depends_on        = [aws_kms_key.cloudwatch]
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${var.project_name}-${var.environment}/frontend"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.cloudwatch.arn
  depends_on        = [aws_kms_key.cloudwatch]
}

resource "aws_cloudwatch_metric_alarm" "backend_cpu" {
  alarm_name          = "${var.project_name}-${var.environment}-backend-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Backend CPU utilization > 80%"

  dimensions = {
    ClusterName = "${var.project_name}-${var.environment}-cluster"
    ServiceName = "${var.project_name}-${var.environment}-backend"
  }
}

resource "aws_cloudwatch_metric_alarm" "backend_memory" {
  alarm_name          = "${var.project_name}-${var.environment}-backend-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Backend memory utilization > 80%"

  dimensions = {
    ClusterName = "${var.project_name}-${var.environment}-cluster"
    ServiceName = "${var.project_name}-${var.environment}-backend"
  }
}
