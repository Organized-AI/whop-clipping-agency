#!/usr/bin/env python3
"""
PDF Report Generator
Main module for generating professional PDF reports.

Usage:
    python report_generator.py --type assessment --company "Company Name" --data data.json --output report.pdf
    python report_generator.py --type investor-matches --company "Company Name" --data matches.json --output matches.pdf
"""

import json
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
)

from styles import (
    NAVY, GOLD, GREEN, RED, GRAY, LIGHT_GRAY, BLUE,
    create_styles, create_table_style
)
from components import (
    create_metric_box, create_metrics_row, create_risk_bar,
    create_verdict_banner, create_tier_header, create_callout_box,
    add_page_footer
)


class ReportGenerator:
    """Base class for PDF report generation."""
    
    def __init__(self, company_name: str, output_path: str):
        self.company_name = company_name
        self.output_path = output_path
        self.styles = create_styles()
        self.story = []
    
    def create_document(self):
        """Create the document template."""
        return SimpleDocTemplate(
            self.output_path,
            pagesize=letter,
            rightMargin=0.6*inch,
            leftMargin=0.6*inch,
            topMargin=0.6*inch,
            bottomMargin=0.75*inch
        )
    
    def add_title(self, title: str, subtitle: str = None):
        """Add title section."""
        self.story.append(Paragraph(title, self.styles['title']))
        self.story.append(Paragraph(self.company_name, self.styles['title']))
        if subtitle:
            self.story.append(Spacer(1, 0.1*inch))
            self.story.append(Paragraph(subtitle, self.styles['subtitle']))
        self.story.append(Spacer(1, 0.2*inch))
    
    def add_section(self, title: str):
        """Add section header."""
        self.story.append(Paragraph(title, self.styles['h1']))
    
    def add_subsection(self, title: str):
        """Add subsection header."""
        self.story.append(Paragraph(title, self.styles['h2']))
    
    def add_body(self, text: str):
        """Add body paragraph."""
        self.story.append(Paragraph(text, self.styles['body']))
    
    def add_bullet(self, text: str):
        """Add bullet point."""
        self.story.append(Paragraph(text, self.styles['bullet']))
    
    def add_spacer(self, height: float = 0.2):
        """Add vertical space."""
        self.story.append(Spacer(1, height*inch))
    
    def add_page_break(self):
        """Add page break."""
        self.story.append(PageBreak())
    
    def add_table(self, data: List[List], col_widths: List[float], header_color=NAVY):
        """Add styled table."""
        table = Table(data, colWidths=[w*inch for w in col_widths])
        table.setStyle(create_table_style(header_color))
        self.story.append(table)
    
    def build(self, footer_func=None):
        """Build the PDF document."""
        doc = self.create_document()
        
        if footer_func is None:
            def footer_func(canvas, doc):
                add_page_footer(canvas, doc, self.company_name)
        
        doc.build(self.story, onFirstPage=footer_func, onLaterPages=footer_func)
        return self.output_path


class InvestmentAssessmentReport(ReportGenerator):
    """Generate investment assessment PDF report."""
    
    def __init__(self, company_name: str, data: Dict[str, Any], output_path: str):
        super().__init__(company_name, output_path)
        self.data = data
    
    def generate(self):
        """Generate the complete report."""
        # Title
        self.add_title("Investment Assessment", f"January 2026 | Crowley Capital")
        
        # Verdict Banner
        verdict = self.data.get('verdict', 'UNDER REVIEW')
        verdict_color = self.data.get('verdict_color', GOLD)
        if isinstance(verdict_color, str):
            verdict_color = {'green': GREEN, 'red': RED, 'gold': GOLD}.get(verdict_color.lower(), GOLD)
        self.story.append(create_verdict_banner(verdict, verdict_color))
        self.add_spacer(0.3)
        
        # Metrics Dashboard
        metrics = self.data.get('metrics', [])
        if metrics:
            self.story.append(create_metrics_row(metrics))
            self.add_spacer(0.3)
        
        # Company Overview
        self.add_section("Company Overview")
        overview = self.data.get('overview', [])
        if overview:
            self.add_table(overview, [2, 4.5])
        self.add_spacer(0.2)
        
        # Executive Summary
        if self.data.get('summary'):
            self.add_section("Executive Summary")
            self.add_body(self.data['summary'])
            self.add_spacer(0.2)
        
        # Revenue Projections
        if self.data.get('revenue_projections'):
            self.add_section("Revenue Projections")
            self.add_table(self.data['revenue_projections'], [1.4, 1.0, 1.0, 1.0, 1.0, 1.0])
            self.add_spacer(0.2)
        
        self.add_page_break()
        
        # Risk Assessment
        if self.data.get('risks'):
            self.add_section("Risk Assessment")
            risk_data = [["Category", "Score", "Bar", "Notes"]]
            for risk in self.data['risks']:
                risk_data.append([
                    risk['category'],
                    f"{risk['score']}/10",
                    create_risk_bar(risk['score']),
                    risk.get('notes', '')
                ])
            self.add_table(risk_data, [1.3, 0.7, 1.5, 2.7])
            self.add_spacer(0.15)
            
            # Overall score
            overall = self.data.get('overall_risk_score', 0)
            level = self.data.get('risk_level', 'UNKNOWN')
            color = RED if overall < 5 else (GOLD if overall < 7 else GREEN)
            self.story.append(create_verdict_banner(
                f"Overall Risk Score: {overall}/10 — {level} RISK", color
            ))
            self.add_spacer(0.25)
        
        # Red Flags
        if self.data.get('red_flags'):
            self.add_section("Red Flags & Concerns")
            for flag in self.data['red_flags']:
                self.add_bullet(flag)
            self.add_spacer(0.2)
        
        # Recommendation
        if self.data.get('recommendation'):
            self.add_section("Investment Recommendation")
            rec = self.data['recommendation']
            rec_color = {'pass': GREEN, 'conditional': GOLD, 'decline': RED}.get(
                rec.get('status', '').lower(), GOLD
            )
            self.story.append(create_verdict_banner(rec.get('verdict', ''), rec_color))
            self.add_spacer(0.15)
            
            if rec.get('rationale'):
                self.add_body(rec['rationale'])
            
            if rec.get('terms'):
                self.add_body("<b>Recommended Terms:</b>")
                for term in rec['terms']:
                    self.add_bullet(term)
        
        return self.build()


class InvestorMatchesReport(ReportGenerator):
    """Generate investor matches PDF report."""
    
    def __init__(self, company_name: str, data: Dict[str, Any], output_path: str):
        super().__init__(company_name, output_path)
        self.data = data
    
    def generate(self):
        """Generate the complete report."""
        # Title
        self.add_title("Investor Matches Report", "January 2026 | Crowley Capital | 40/40/20 Algorithm")
        
        # Startup Profile
        self.add_section("Startup Profile")
        profile = self.data.get('profile', [])
        if profile:
            self.add_table(profile, [1.8, 5.2])
        self.add_spacer(0.25)
        
        # Match Summary
        self.add_section("Top 10 Investor Matches - Summary")
        matches = self.data.get('matches', [])
        if matches:
            summary_data = [["Rank", "Investor", "Score", "Tier", "Check Range", "Key Fit"]]
            for i, m in enumerate(matches[:10], 1):
                summary_data.append([
                    str(i),
                    m.get('name', ''),
                    f"{m.get('score', 0):.2f}",
                    m.get('tier', ''),
                    m.get('check_range', ''),
                    m.get('fit', '')
                ])
            self.add_table(summary_data, [0.4, 1.6, 0.5, 0.6, 1.0, 1.3])
        self.add_spacer(0.2)
        
        self.add_page_break()
        
        # Detailed Profiles
        self.add_section("Top 5 Investor Profiles - Detailed")
        for i, m in enumerate(matches[:5], 1):
            tier = m.get('tier', 'Good')
            header_color = GREEN if tier == "Excellent" else BLUE
            
            self.add_subsection(f"{i}. {m.get('name', '')} — Score: {m.get('score', 0):.2f} ({tier})")
            
            detail_data = [
                ["Website", m.get('website', '')],
                ["HQ", m.get('hq', '')],
                ["Check Range", m.get('check_range', '')],
                ["Thesis", m.get('thesis', '')],
            ]
            self.add_table(detail_data, [1.2, 5.5])
            
            if m.get('fit_notes'):
                self.add_body(f"<b>Fit Notes:</b> {m['fit_notes']}")
            self.add_spacer(0.15)
        
        self.add_page_break()
        
        # Outreach Strategy
        self.add_section("Recommended Outreach Strategy")
        
        tiers = self.data.get('outreach_tiers', {})
        
        if tiers.get('tier1'):
            self.story.append(create_tier_header("TIER 1: Lead Investor Candidates", 1))
            for item in tiers['tier1']:
                self.add_bullet(item)
            self.add_spacer(0.15)
        
        if tiers.get('tier2'):
            self.story.append(create_tier_header("TIER 2: Syndicate Participants", 2))
            for item in tiers['tier2']:
                self.add_bullet(item)
            self.add_spacer(0.15)
        
        if tiers.get('tier3'):
            self.story.append(create_tier_header("TIER 3: Strategic / Specialized", 3))
            for item in tiers['tier3']:
                self.add_bullet(item)
            self.add_spacer(0.25)
        
        # Key Insight
        if self.data.get('insight'):
            self.story.append(create_callout_box(
                f"KEY INSIGHT: {self.data['insight']}", GREEN
            ))
        
        return self.build()


def main():
    parser = argparse.ArgumentParser(description='Generate PDF Report')
    parser.add_argument('--type', required=True, 
                       choices=['assessment', 'investor-matches'],
                       help='Report type')
    parser.add_argument('--company', required=True, help='Company name')
    parser.add_argument('--data', required=True, help='JSON data file path')
    parser.add_argument('--output', required=True, help='Output PDF path')
    
    args = parser.parse_args()
    
    # Load data
    with open(args.data) as f:
        data = json.load(f)
    
    # Generate report
    if args.type == 'assessment':
        report = InvestmentAssessmentReport(args.company, data, args.output)
    else:
        report = InvestorMatchesReport(args.company, data, args.output)
    
    output = report.generate()
    print(f"Report generated: {output}")


if __name__ == '__main__':
    main()
