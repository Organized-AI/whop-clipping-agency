#!/usr/bin/env python3
"""
PDF Report Styles
Centralized style definitions for Crowley Capital branded reports.
"""

from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

# =============================================================================
# BRAND COLORS
# =============================================================================

NAVY = HexColor('#1a365d')       # Headers, primary text
GOLD = HexColor('#d69e2e')       # Accents, warnings, borders
GREEN = HexColor('#38a169')      # Positive indicators
RED = HexColor('#e53e3e')        # Negative indicators, high risk
GRAY = HexColor('#718096')       # Secondary text, labels
LIGHT_GRAY = HexColor('#f7fafc') # Backgrounds, alternating rows
MEDIUM_GRAY = HexColor('#e2e8f0') # Borders
BLUE = HexColor('#3182ce')       # Links, tier 2 elements
PURPLE = HexColor('#805ad5')     # Special highlights

# =============================================================================
# PARAGRAPH STYLES
# =============================================================================

def create_styles():
    """Create all paragraph styles for reports."""
    base = getSampleStyleSheet()
    
    return {
        # Titles
        'title': ParagraphStyle(
            'Title',
            parent=base['Title'],
            fontSize=24,
            textColor=NAVY,
            spaceAfter=6,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ),
        'subtitle': ParagraphStyle(
            'Subtitle',
            parent=base['Normal'],
            fontSize=12,
            textColor=GRAY,
            alignment=TA_CENTER,
            spaceAfter=20
        ),
        
        # Headings
        'h1': ParagraphStyle(
            'H1',
            parent=base['Heading1'],
            fontSize=16,
            textColor=NAVY,
            spaceBefore=20,
            spaceAfter=12,
            fontName='Helvetica-Bold'
        ),
        'h2': ParagraphStyle(
            'H2',
            parent=base['Heading2'],
            fontSize=13,
            textColor=NAVY,
            spaceBefore=15,
            spaceAfter=8,
            fontName='Helvetica-Bold'
        ),
        'h3': ParagraphStyle(
            'H3',
            parent=base['Heading3'],
            fontSize=11,
            textColor=BLUE,
            spaceBefore=10,
            spaceAfter=6,
            fontName='Helvetica-Bold'
        ),
        
        # Body text
        'body': ParagraphStyle(
            'Body',
            parent=base['Normal'],
            fontSize=10,
            textColor=black,
            spaceAfter=8,
            leading=14
        ),
        'body_bold': ParagraphStyle(
            'BodyBold',
            parent=base['Normal'],
            fontSize=10,
            textColor=black,
            spaceAfter=8,
            leading=14,
            fontName='Helvetica-Bold'
        ),
        'small': ParagraphStyle(
            'Small',
            parent=base['Normal'],
            fontSize=8,
            textColor=GRAY,
            spaceAfter=4,
            leading=10
        ),
        
        # Lists
        'bullet': ParagraphStyle(
            'Bullet',
            parent=base['Normal'],
            fontSize=10,
            textColor=black,
            leftIndent=20,
            spaceAfter=4,
            leading=14
        ),
        
        # Special
        'verdict': ParagraphStyle(
            'Verdict',
            parent=base['Normal'],
            fontSize=14,
            textColor=white,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            spaceBefore=10,
            spaceAfter=10
        ),
        'metric_value': ParagraphStyle(
            'MetricValue',
            parent=base['Normal'],
            fontSize=18,
            textColor=NAVY,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ),
        'metric_label': ParagraphStyle(
            'MetricLabel',
            parent=base['Normal'],
            fontSize=9,
            textColor=GRAY,
            alignment=TA_CENTER
        ),
        
        # Footer
        'footer': ParagraphStyle(
            'Footer',
            parent=base['Normal'],
            fontSize=8,
            textColor=GRAY,
            alignment=TA_CENTER
        ),
    }


# =============================================================================
# TABLE STYLES
# =============================================================================

from reportlab.platypus import TableStyle

def create_table_style(header_color=NAVY):
    """Create standard table style with header and alternating rows."""
    return TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), header_color),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        
        # Data rows
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        
        # Borders and backgrounds
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LIGHT_GRAY]),
        
        # Padding
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ])


def create_compact_table_style(header_color=NAVY):
    """Create compact table style with less padding."""
    return TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), header_color),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LIGHT_GRAY]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ])


def create_borderless_table_style():
    """Create table style without borders (for layouts)."""
    return TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ])
