terraform {
  required_version = ">= 1.10.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment after running: terraform apply -target=module.state_bucket
  backend "s3" {
    bucket       = "borderless-hms-terraform-state-600627355607"
    key          = "production/terraform.tfstate"
    region       = "eu-north-1"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = var.aws_region
}

module "state_bucket" {
  source            = "./modules/state_bucket"
  state_bucket_name = var.state_bucket_name
}

module "ecr" {
  source       = "./modules/ecr"
  project_name = var.project_name
  environment  = var.environment
}

module "vpc" {
  source       = "./modules/vpc"
  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
}

module "security_groups" {
  source       = "./modules/security_groups"
  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
}

module "rds" {
  source              = "./modules/rds"
  project_name        = var.project_name
  environment         = var.environment
  private_subnet_ids  = module.vpc.private_subnet_ids
  db_security_group_id = module.security_groups.rds_sg_id
  postgres_password   = var.postgres_password
  rds_instance_class  = var.rds_instance_class
  rds_multi_az        = var.rds_multi_az
}

module "alb" {
  source            = "./modules/alb"
  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  alb_sg_id         = module.security_groups.alb_sg_id
}

module "cloudwatch" {
  source       = "./modules/cloudwatch"
  project_name = var.project_name
  environment  = var.environment
}

module "ecs" {
  source                    = "./modules/ecs"
  project_name              = var.project_name
  environment               = var.environment
  aws_region                = var.aws_region
  aws_account_id            = var.aws_account_id
  vpc_id                    = module.vpc.vpc_id
  private_subnet_ids        = module.vpc.private_subnet_ids
  backend_sg_id             = module.security_groups.backend_sg_id
  frontend_sg_id            = module.security_groups.frontend_sg_id
  backend_target_group_arn  = module.alb.backend_target_group_arn
  frontend_target_group_arn = module.alb.frontend_target_group_arn
  backend_ecr_url           = module.ecr.backend_repository_url
  frontend_ecr_url          = module.ecr.frontend_repository_url
  db_host                   = module.rds.db_host
  db_name                   = module.rds.db_name
  db_user                   = module.rds.db_user
  postgres_password         = var.postgres_password
  jwt_secret_key            = var.jwt_secret_key
  log_group_backend         = module.cloudwatch.log_group_backend
  log_group_frontend        = module.cloudwatch.log_group_frontend
  backend_min_tasks         = var.backend_min_tasks
  backend_max_tasks         = var.backend_max_tasks
  frontend_min_tasks        = var.frontend_min_tasks
  frontend_max_tasks        = var.frontend_max_tasks
}
