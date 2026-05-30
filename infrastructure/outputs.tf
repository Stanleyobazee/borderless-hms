output "alb_dns_name" {
  value       = module.alb.alb_dns_name
  description = "Access the app at this URL"
}

output "backend_ecr_repository_url" {
  value = module.ecr.backend_repository_url
}

output "frontend_ecr_repository_url" {
  value = module.ecr.frontend_repository_url
}
