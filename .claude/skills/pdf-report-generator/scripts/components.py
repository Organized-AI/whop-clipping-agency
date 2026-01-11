#!/usr/bin/env python3
"""
PDF Report Components
Reusable visual components for professional reports.
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white
from reportlab.platypus import Table, TableStyle, Paragraph

from styles import (
    NAVY, GOLD, GREEN, RED, GRAY, LIGHT_GRAY, BLUE,
    create_styles
)

styles = create_styles()


# =============================================================================
# METRIC BOXES
# =============================================================================

def create_metric_box(value: str, label: str, color=NAVY, width=1.4):
    """
    Create a KPI display box with large value and small label.
    
    Args:
        value: The metric value to display (e.g., "$2.4M")
        label: The label below the value (e.g., "ARR")
        color: Border color (NAVY, GREEN, RED, GOLD)
        width: Box width in inches
    
    Returns:
        Table flowable
    """
    data = [[value], [label]]
    table = Table(data, colWidths=[width*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_GRAY),
        ('BOX', (0, 0), (-1, -1), 2, color),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (0, 0), 16),
        ('FONTSIZE', (0, 1), (0, 1), 8),
        ('TEXTCOLOR', (0, 0), (0, 0), NAVY),
        ('TEXTCOLOR', (0, 1), (0, 1), GRAY),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    return table


def create_metrics_row(metrics: list, box_width=1.6):
    """
    Create a row of metric boxes.
    
    Args:
        metrics: List of tuples [(value, label, color), ...]
        box_width: Width of each box in inches
    
    Returns:
        Table flowable containing metric boxes
    """
    boxes = []
    for item in metrics:
        if len(item) == 3:
            value, label, color = item
        else:
            value, label = item
            color = NAVY
        boxes.append(create_metric_box(value, label, color))
    
    row = Table([boxes], colWidths=[box_width*inch] * len(boxes))
    row.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return row


# =============================================================================
# RISK BARS
# =============================================================================

def create_risk_bar(score: float, max_score: int = 10) -> str:
    """
    Create text-based risk visualization bar.
    
    Args:
        score: The score value (e.g., 7.5)
        max_score: Maximum score (default 10)
    
    Returns:
        String like "███████░░░"
    """
    filled = int(score)
    empty = max_score - filled
    return '█' * filled + '░' * empty


def create_risk_indicator(score: float) -> str:
    """
    Create traffic light indicator based on score.
    
    Args:
        score: Score out of 10
    
    Returns:
        Emoji indicator (🟢, 🟡, 🔴)
    """
    if score >= 7:
        return '🟢'
    elif score >= 5:
        return '🟡'
    else:
        return '🔴'


# =============================================================================
# BANNERS & BOXES
# =============================================================================

def create_verdict_banner(text: str, color, width=6.5):
    """
    Create full-width colored banner for verdicts/status.
    
    Args:
        text: Banner text
        color: Background color (GREEN, RED, GOLD, etc.)
        width: Banner width in inches
    
    Returns:
        Table flowable
    """
    table = Table([[text]], colWidths=[width*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), color),
        ('TEXTCOLOR', (0, 0), (-1, -1), white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 14),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    return table


def create_tier_header(text: str, tier: int, width=6.8):
    """
    Create tiered section header (Tier 1/2/3).
    
    Args:
        text: Header text
        tier: Tier number (1=green, 2=blue, 3=gold)
        width: Header width in inches
    
    Returns:
        Table flowable
    """
    colors = {1: GREEN, 2: BLUE, 3: GOLD}
    color = colors.get(tier, GRAY)
    
    table = Table([[text]], colWidths=[width*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), color),
        ('TEXTCOLOR', (0, 0), (-1, -1), white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    return table


def create_callout_box(text: str, border_color=GREEN, width=6.8):
    """
    Create highlighted callout box for key insights.
    
    Args:
        text: Callout text
        border_color: Border color
        width: Box width in inches
    
    Returns:
        Table flowable
    """
    table = Table([[text]], colWidths=[width*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_GRAY),
        ('BOX', (0, 0), (-1, -1), 2, border_color),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
    ]))
    return table


def create_score_badge(score: float, tier: str, width=1.2):
    """
    Create compact score badge with tier indicator.
    
    Args:
        score: Numeric score
        tier: Quality tier ("Excellent", "Good", "Fair")
        width: Badge width in inches
    
    Returns:
        Table flowable
    """
    if tier == "Excellent":
        color = GREEN
    elif tier == "Good":
        color = BLUE
    else:
        color = GOLD
    
    data = [[f"{score:.2f}", tier]]
    table = Table(data, colWidths=[0.5*inch, 0.7*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), color),
        ('BACKGROUND', (1, 0), (1, 0), LIGHT_GRAY),
        ('TEXTCOLOR', (0, 0), (0, 0), white),
        ('TEXTCOLOR', (1, 0), (1, 0), color),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOX', (0, 0), (-1, -1), 1, color),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    return table


# =============================================================================
# PAGE ELEMENTS
# =============================================================================

def add_page_footer(canvas, doc, company_name: str, report_type: str = ""):
    """
    Add consistent footer to each page.
    
    Args:
        canvas: ReportLab canvas
        doc: Document object
        company_name: Company name for footer
        report_type: Optional report type suffix
    """
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(GRAY)
    page_num = canvas.getPageNumber()
    
    if report_type:
        footer_text = f"Crowley Capital | {company_name} {report_type} | Page {page_num}"
    else:
        footer_text = f"Crowley Capital | {company_name} | Page {page_num}"
    
    canvas.drawCentredString(letter[0]/2, 0.5*inch, footer_text)
    canvas.restoreState()


def add_page_header(canvas, doc, title: str):
    """
    Add header to pages (except first).
    
    Args:
        canvas: ReportLab canvas
        doc: Document object
        title: Header title
    """
    if doc.page > 1:
        canvas.saveState()
        canvas.setFont('Helvetica-Bold', 10)
        canvas.setFillColor(NAVY)
        canvas.drawString(0.6*inch, letter[1] - 0.4*inch, title)
        
        # Gold line under header
        canvas.setStrokeColor(GOLD)
        canvas.setLineWidth(1)
        canvas.line(0.6*inch, letter[1] - 0.5*inch, 
                   letter[0] - 0.6*inch, letter[1] - 0.5*inch)
        canvas.restoreState()
