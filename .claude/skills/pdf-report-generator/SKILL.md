---
name: pdf-report-generator
description: Professional PDF report generator using ReportLab with branded styling, metric dashboards, risk scorecards, and data tables. Creates executive-ready documents from markdown/JSON data. Triggers on "create PDF", "generate report", "investment memo PDF", "professional document", "branded report".
---

# PDF Report Generator

Create professional, branded PDF reports using Python's ReportLab library with consistent styling, metric boxes, risk bars, tiered tables, and executive formatting.

## Capabilities

- **Branded Reports** — Custom colors, fonts, headers/footers
- **Metric Dashboards** — Visual KPI boxes with color-coded status
- **Risk Scorecards** — Bar visualizations for scoring frameworks
- **Data Tables** — Alternating rows, styled headers, proper spacing
- **Tiered Sections** — Color-coded priority/category boxes
- **Multi-page** — Automatic pagination with consistent footers

## Quick Start

```python
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, Spacer

# Create document
doc = SimpleDocTemplate("report.pdf", pagesize=letter)
story = []

# Add content
story.append(Paragraph("Report Title", styles['title']))
story.append(table)
story.append(Spacer(1, 0.2*inch))

# Build
doc.build(story)
```

## Brand Color Palette

```python
# Crowley Capital Colors
NAVY = HexColor('#1a365d')      # Headers, primary text
GOLD = HexColor('#d69e2e')      # Accents, warnings, borders
GREEN = HexColor('#38a169')     # Positive indicators
RED = HexColor('#e53e3e')       # Negative indicators, high risk
GRAY = HexColor('#718096')      # Secondary text, labels
LIGHT_GRAY = HexColor('#f7fafc') # Backgrounds, alternating rows
BLUE = HexColor('#3182ce')      # Links, tier 2 elements
PURPLE = HexColor('#805ad5')    # Special highlights
```

## Core Components

### 1. Custom Paragraph Styles

```python
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

def create_styles():
    base = getSampleStyleSheet()
    
    return {
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
        'body': ParagraphStyle(
            'Body',
            parent=base['Normal'],
            fontSize=10,
            textColor=black,
            spaceAfter=8,
            leading=14
        ),
        'bullet': ParagraphStyle(
            'Bullet',
            parent=base['Normal'],
            fontSize=10,
            textColor=black,
            leftIndent=20,
            spaceAfter=4,
            leading=14
        ),
        'footer': ParagraphStyle(
            'Footer',
            parent=base['Normal'],
            fontSize=8,
            textColor=GRAY,
            alignment=TA_CENTER
        ),
    }
```

### 2. Styled Data Tables

```python
from reportlab.platypus import Table, TableStyle
from reportlab.lib.colors import white

def create_table_style(header_color=NAVY):
    """Standard table with header styling and alternating rows."""
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

# Usage
data = [
    ["Metric", "Value", "Status"],
    ["ARR", "$2.4M", "🟢"],
    ["Growth", "142%", "🟢"],
    ["Burn", "$180K/mo", "🟡"],
]
table = Table(data, colWidths=[2*inch, 1.5*inch, 1*inch])
table.setStyle(create_table_style())
```

### 3. Metric Dashboard Boxes

```python
def create_metric_box(value, label, color=NAVY):
    """Create a KPI display box with value and label."""
    data = [[value], [label]]
    table = Table(data, colWidths=[1.4*inch])
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

# Usage - Row of 4 metrics
metrics_data = [[
    create_metric_box("$10M", "Round Size"),
    create_metric_box("$100M", "Post-Money"),
    create_metric_box("365%", "Target IRR", RED),
    create_metric_box("16.85x", "Exit Multiple"),
]]
metrics_table = Table(metrics_data, colWidths=[1.6*inch]*4)
```

### 4. Risk Score Bars

```python
def create_risk_bar(score, max_score=10):
    """Create text-based risk visualization bar."""
    filled = int(score)
    empty = max_score - filled
    bar = '█' * filled + '░' * empty
    return bar

# Usage in table
risk_data = [
    ["Category", "Score", "Bar", "Notes"],
    ["Market Risk", "7/10", create_risk_bar(7), "Proven TAM"],
    ["Team Risk", "8/10", create_risk_bar(8), "Strong founders"],
    ["Financial Risk", "5/10", create_risk_bar(5), "Burn concerns"],
]
```

### 5. Verdict/Status Banners

```python
def create_verdict_banner(text, color):
    """Create full-width colored banner for verdicts/status."""
    table = Table([[text]], colWidths=[6.5*inch])
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

# Usage
story.append(create_verdict_banner("HIGH RISK / HIGH REWARD", RED))
story.append(create_verdict_banner("CONDITIONAL PASS", GREEN))
story.append(create_verdict_banner("TIER 1: Lead Investors", GREEN))
```

### 6. Page Headers/Footers

```python
def add_page_footer(canvas, doc, company_name):
    """Add consistent footer to each page."""
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(GRAY)
    page_num = canvas.getPageNumber()
    footer_text = f"Crowley Capital | {company_name} | Page {page_num}"
    canvas.drawCentredString(letter[0]/2, 0.5*inch, footer_text)
    canvas.restoreState()

# Usage in doc.build()
doc.build(story, onFirstPage=footer, onLaterPages=footer)
```

## Complete Report Template

```python
#!/usr/bin/env python3
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
)

# Colors
NAVY = HexColor('#1a365d')
GOLD = HexColor('#d69e2e')
GREEN = HexColor('#38a169')
RED = HexColor('#e53e3e')
GRAY = HexColor('#718096')
LIGHT_GRAY = HexColor('#f7fafc')

def generate_report(company_name, data, output_path):
    """Generate professional PDF report."""
    
    # Create styles
    styles = create_styles()
    
    # Create document
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=0.6*inch,
        leftMargin=0.6*inch,
        topMargin=0.6*inch,
        bottomMargin=0.75*inch
    )
    
    story = []
    
    # Title Section
    story.append(Paragraph("Investment Assessment", styles['title']))
    story.append(Paragraph(company_name, styles['title']))
    story.append(Paragraph("January 2026 | Crowley Capital", styles['subtitle']))
    story.append(Spacer(1, 0.2*inch))
    
    # Verdict Banner
    story.append(create_verdict_banner(data['verdict'], data['verdict_color']))
    story.append(Spacer(1, 0.3*inch))
    
    # Metrics Dashboard
    metrics_row = [[
        create_metric_box(data['round_size'], "Round Size"),
        create_metric_box(data['valuation'], "Post-Money"),
        create_metric_box(data['target_return'], "Target IRR"),
        create_metric_box(data['exit_multiple'], "Exit Multiple"),
    ]]
    metrics_table = Table(metrics_row, colWidths=[1.6*inch]*4)
    story.append(metrics_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Company Overview
    story.append(Paragraph("Company Overview", styles['h1']))
    overview_table = Table(data['overview'], colWidths=[2*inch, 4.5*inch])
    overview_table.setStyle(create_table_style())
    story.append(overview_table)
    
    # Risk Assessment
    story.append(PageBreak())
    story.append(Paragraph("Risk Assessment", styles['h1']))
    risk_table = Table(data['risks'], colWidths=[1.3*inch, 0.7*inch, 1.5*inch, 2.7*inch])
    risk_table.setStyle(create_table_style())
    story.append(risk_table)
    
    # Footer
    def footer(canvas, doc):
        add_page_footer(canvas, doc, company_name)
    
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    return output_path
```

## Report Types Supported

| Report Type | Key Components |
|-------------|----------------|
| **Investment Assessment** | Verdict banner, metrics dashboard, risk scorecard, sensitivity analysis |
| **Investor Matches** | Profile table, ranked matches, tiered outreach strategy |
| **Due Diligence Summary** | Executive summary, financials tables, cap table, recommendations |
| **LP Report** | Portfolio overview, fund performance, distributions |
| **IC Materials** | One-pager format, key metrics, decision framework |

## Best Practices

### Spacing & Layout
- Use `Spacer(1, 0.2*inch)` between sections
- Keep margins at 0.5-0.75 inches
- Use `PageBreak()` for logical section breaks
- Balance white space with content density

### Typography
- Titles: 24pt Helvetica-Bold
- Section headers: 16pt Helvetica-Bold
- Body text: 10pt with 14pt leading
- Tables: 9pt for data, 10pt for headers

### Color Usage
- Navy for headers and primary text
- Green for positive indicators
- Red for negative/risk indicators
- Gold for warnings and accents
- Gray for secondary text and borders

### Tables
- Always use alternating row colors
- Include proper padding (6-8pt)
- Right-align numbers, left-align text
- Use consistent column widths

## Dependencies

```
reportlab>=4.0.0
```

## File Structure

```
skills/pdf-report-generator/
├── SKILL.md                    # This documentation
├── scripts/
│   ├── report_generator.py     # Core generation functions
│   ├── styles.py               # Style definitions
│   └── components.py           # Reusable components
└── templates/
    ├── investment_assessment.py
    ├── investor_matches.py
    └── diligence_summary.py
```

## Integration

### With diligence-report skill
```python
from pdf_report_generator import generate_report
from diligence_report import compile_analysis

# Compile markdown analysis
data = compile_analysis("./data-room")

# Generate PDF
generate_report(data['company'], data, "./output/report.pdf")
```

### With Mermaid charts
```python
# Render Mermaid chart to image
chart_path = mermaid_chart_mcp.render(ownership_pie_code)

# Embed in PDF
from reportlab.platypus import Image
chart = Image(chart_path, width=4*inch, height=3*inch)
story.append(chart)
```

---

*Crowley Capital Diligence Tool — PDF Report Generator Skill*
