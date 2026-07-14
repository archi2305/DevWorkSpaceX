import logging
import os
from datetime import datetime
from pythonjsonlogger import jsonlogger


class JsonFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter with additional fields."""
    
    def add_fields(self, log_record: dict, record: logging.LogRecord, message_dict: dict):
        super().add_fields(log_record, record, message_dict)
        
        # Add custom fields
        log_record['timestamp'] = datetime.utcnow().isoformat()
        log_record['level'] = record.levelname
        log_record['logger'] = record.name
        log_record['service'] = 'devworkspace-backend'
        
        if hasattr(record, 'user_id'):
            log_record['user_id'] = record.user_id
        
        if hasattr(record, 'request_id'):
            log_record['request_id'] = record.request_id


def setup_logging(
    level: str = os.getenv('LOG_LEVEL', 'INFO'),
    log_format: str = os.getenv('LOG_FORMAT', 'json')
) -> None:
    """Configure structured logging for the application."""
    
    log_level = getattr(logging, level.upper(), logging.INFO)
    
    if log_format == 'json':
        formatter = JsonFormatter(
            '%(timestamp)s %(level)s %(name)s %(message)s'
        )
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    
    # File handler (optional)
    log_dir = os.getenv('LOG_DIR', 'logs')
    os.makedirs(log_dir, exist_ok=True)
    file_handler = logging.FileHandler(os.path.join(log_dir, 'app.log'))
    file_handler.setLevel(log_level)
    file_handler.setFormatter(formatter)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.setLevel(log_level)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    
    # Configure specific loggers
    loggers = {
        'uvicorn': log_level,
        'uvicorn.access': log_level,
        'sqlalchemy': logging.WARNING,
        'httpx': logging.WARNING,
    }
    
    for logger_name, logger_level in loggers.items():
        logger = logging.getLogger(logger_name)
        logger.handlers.clear()
        logger.setLevel(logger_level)
        logger.addHandler(console_handler)
        logger.addHandler(file_handler)
        logger.propagate = False


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with the specified name."""
    return logging.getLogger(name)
