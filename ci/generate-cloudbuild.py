#!/usr/bin/env python3
import os
import re
from pathlib import Path

def load_env_vars(env_file):
    """Load environment variables from .env file"""
    env_vars = {}
    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                # Remove surrounding quotes if present
                value = value.strip('"').strip("'")
                env_vars[key] = value
    return env_vars

def replace_variables(template_content, env_vars):
    """Replace $VARIABLE with actual values"""
    result = template_content
    for key, value in env_vars.items():
        # Replace $$KEY with $value (for Cloud Build templates)
        pattern = r'\$\$' + re.escape(key) + r'(?![A-Za-z0-9_])'
        result = re.sub(pattern, value, result)
    return result

def main():
    template_file = 'cloudbuild_template.yaml'
    env_file = '.env'
    
    # Load environment variables
    env_vars = load_env_vars(env_file)
    output_file = f"cloudbuild_{env_vars.get('PROJECT_ID', 'unknown')}.yaml"
    
    # Read template
    with open(template_file, 'r') as f:
        template_content = f.read()
    
    # Replace variables
    result_content = replace_variables(template_content, env_vars)
    
    # Write output
    with open(output_file, 'w') as f:
        f.write(result_content)
    
    print(f"✅ Generated {output_file} from {template_file} using .env variables.")

if __name__ == '__main__':
    main()