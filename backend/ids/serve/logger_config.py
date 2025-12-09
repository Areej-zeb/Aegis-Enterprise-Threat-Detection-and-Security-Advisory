"""
Aegis IDS - Centralized Logging Configuration
Provides structured logging with rotation for all components
"""

import logging
import logging.handlers
import json
from pathlib import Path
from datetime import datetime
from typing import Any, Dict

# Create logs directory if it doesn't exist
LOGS_DIR = Path("../logs")
LOGS_DIR.mkdir(parents=True, exist_ok=True)

class StructuredFormatter(logging.Formatter):
    """Custom formatter that outputs JSON-structured logs"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields if present
        if hasattr(record, 'extra_data'):
            log_data.update(record.extra_data)
        
        return json.dumps(log_data)


class HumanReadableFormatter(logging.Formatter):
    """Formatter for human-readable console output"""
    
    def __init__(self):
        super().__init__(
            fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )


def setup_logger(
    name: str,
    log_file: str,
    level: int = logging.INFO,
    console_output: bool = True,
    structured: bool = False
) -> logging.Logger:
    """
    Set up a logger with file and console handlers.
    
    Args:
        name: Logger name
        log_file: Log file name (will be created in logs/)
        level: Logging level
        console_output: Whether to also output to console
        structured: Whether to use JSON structured logging
    
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Clear existing handlers
    logger.handlers.clear()
    
    # File handler with rotation (10MB max, keep 5 backups)
    file_path = LOGS_DIR / log_file
    file_handler = logging.handlers.RotatingFileHandler(
        file_path,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setLevel(level)
    
    if structured:
        file_handler.setFormatter(StructuredFormatter())
    else:
        file_handler.setFormatter(HumanReadableFormatter())
    
    logger.addHandler(file_handler)
    
    # Console handler
    if console_output:
        console_handler = logging.StreamHandler()
        console_handler.setLevel(level)
        console_handler.setFormatter(HumanReadableFormatter())
        logger.addHandler(console_handler)
    
    return logger


# Pre-configured loggers for different components
def get_detection_logger() -> logging.Logger:
    """Logger for ML detection events"""
    return setup_logger('aegis.detection', 'detections.log', structured=True)


def get_alert_logger() -> logging.Logger:
    """Logger for security alerts"""
    return setup_logger('aegis.alerts', 'alerts.log', structured=True)


def get_system_logger() -> logging.Logger:
    """Logger for system events"""
    return setup_logger('aegis.system', 'system.log', structured=False)


def get_performance_logger() -> logging.Logger:
    """Logger for performance metrics"""
    return setup_logger('aegis.performance', 'performance.log', structured=True)


def get_audit_logger() -> logging.Logger:
    """Logger for audit trail (API calls, user actions)"""
    return setup_logger('aegis.audit', 'audit.log', structured=True)


def get_error_logger() -> logging.Logger:
    """Logger for errors and exceptions"""
    return setup_logger('aegis.error', 'errors.log', structured=True)


def log_with_extra(logger: logging.Logger, level: int, message: str, **kwargs):
    """
    Log a message with extra structured data.
    
    Args:
        logger: Logger instance
        level: Logging level (logging.INFO, logging.WARNING, etc.)
        message: Log message
        **kwargs: Extra data to include in structured logs
    """
    extra = {'extra_data': kwargs}
    logger.log(level, message, extra=extra)
