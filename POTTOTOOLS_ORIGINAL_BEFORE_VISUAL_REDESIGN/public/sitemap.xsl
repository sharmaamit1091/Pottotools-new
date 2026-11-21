<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title>XML Sitemap | PottoTools</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style type="text/css">
          :root {
            --primary: #0284c7;
            --primary-dark: #0369a1;
            --primary-light: #e0f2fe;
            --text-main: #0f172a;
            --text-muted: #475569;
            --bg-page: #f8fafc;
            --bg-card: #ffffff;
            --border-color: #e2e8f0;
            --badge-green-bg: #dcfce7;
            --badge-green-text: #15803d;
            --badge-blue-bg: #e0f2fe;
            --badge-blue-text: #0369a1;
          }

          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif;
            background-color: var(--bg-page);
            color: var(--text-main);
            line-height: 1.5;
            padding: 24px 16px;
          }

          .container {
            max-width: 1100px;
            margin: 0 auto;
          }

          .header-card {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #ffffff;
            padding: 32px 28px;
            border-radius: 16px;
            margin-bottom: 24px;
            box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2);
          }

          .brand-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 16px;
            margin-bottom: 16px;
          }

          .brand-title {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .brand-title h1 {
            font-size: 26px;
            font-weight: 800;
            letter-spacing: -0.02em;
            color: #ffffff;
          }

          .brand-tag {
            background-color: rgba(14, 165, 233, 0.2);
            color: #38bdf8;
            font-size: 12px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 9999px;
            border: 1px solid rgba(56, 189, 248, 0.3);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .home-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background-color: #0284c7;
            color: #ffffff;
            text-decoration: none;
            font-size: 13px;
            font-weight: 600;
            padding: 8px 16px;
            border-radius: 8px;
            transition: all 0.2s ease;
          }

          .home-link:hover {
            background-color: #0369a1;
            transform: translateY(-1px);
          }

          .header-desc {
            font-size: 14px;
            color: #94a3b8;
            max-width: 780px;
            line-height: 1.6;
          }

          .info-banner {
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 12px;
            padding: 16px 20px;
            margin-bottom: 24px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            color: #1e3a8a;
            font-size: 13px;
          }

          .info-icon {
            font-size: 18px;
            line-height: 1;
            color: #2563eb;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
          }

          .stat-card {
            background-color: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 18px 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          }

          .stat-label {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted);
            margin-bottom: 4px;
          }

          .stat-value {
            font-size: 24px;
            font-weight: 800;
            color: var(--text-main);
          }

          .filter-bar {
            background-color: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 16px 20px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 12px;
          }

          .filter-input {
            flex: 1;
            min-width: 240px;
            padding: 10px 14px;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s;
          }

          .filter-input:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
          }

          .table-container {
            background-color: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
          }

          table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 13px;
          }

          thead {
            background-color: #f1f5f9;
            border-bottom: 1px solid var(--border-color);
          }

          th {
            padding: 14px 18px;
            font-weight: 700;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #475569;
          }

          td {
            padding: 14px 18px;
            border-bottom: 1px solid #f1f5f9;
            color: var(--text-main);
            vertical-align: middle;
          }

          tr:last-child td {
            border-bottom: none;
          }

          tr:hover td {
            background-color: #f8fafc;
          }

          .url-link {
            color: #0284c7;
            text-decoration: none;
            font-weight: 600;
            word-break: break-all;
          }

          .url-link:hover {
            color: #0369a1;
            text-decoration: underline;
          }

          .badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.03em;
          }

          .badge-priority-high {
            background-color: #dcfce7;
            color: #166534;
          }

          .badge-priority-mid {
            background-color: #e0f2fe;
            color: #075985;
          }

          .badge-priority-low {
            background-color: #f1f5f9;
            color: #475569;
          }

          .badge-freq {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: 600;
          }

          .footer-note {
            text-align: center;
            font-size: 12px;
            color: #64748b;
            margin-top: 32px;
            padding-bottom: 16px;
          }

          @media (max-width: 768px) {
            body {
              padding: 12px 8px;
            }
            .header-card {
              padding: 20px 16px;
            }
            .brand-title h1 {
              font-size: 20px;
            }
            th, td {
              padding: 10px 12px;
            }
            .col-freq {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header Card -->
          <div class="header-card">
            <div class="brand-row">
              <div class="brand-title">
                <h1>PottoTools XML Sitemap</h1>
                <span class="brand-tag">Verified SEO</span>
              </div>
              <a href="https://pottotools.in/" class="home-link">&#8592; Back to PottoTools.in</a>
            </div>
            <p class="header-desc">
              This XML Sitemap is generated according to official Sitemaps.org XML standards for search engine indexing by Googlebot, Bingbot, and other automated crawlers. All listed web utilities run 100% client-side in the browser.
            </p>
          </div>

          <!-- Notice explaining why this style exists -->
          <div class="info-banner">
            <div class="info-icon">&#9432;</div>
            <div>
              <strong>Browser Preview Note:</strong> Search engines like Google and Bing read the underlying raw XML structure directly. Web browsers apply this styled XSL view for convenient human inspection of the indexed URLs.
            </div>
          </div>

          <!-- Stats Grid -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total URLs Indexed</div>
              <div class="stat-value">
                <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Primary Domain</div>
              <div class="stat-value" style="font-size: 18px; font-weight: 700; color: #0284c7; padding-top: 4px;">
                https://pottotools.in
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Encoding &amp; Protocol</div>
              <div class="stat-value" style="font-size: 18px; font-weight: 700; color: #166534; padding-top: 4px;">
                UTF-8 / Sitemaps 0.9
              </div>
            </div>
          </div>

          <!-- Table Container -->
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th style="width: 50px;">#</th>
                  <th>Indexed Page URL</th>
                  <th class="col-freq" style="width: 130px;">Change Freq</th>
                  <th style="width: 110px;">Priority</th>
                  <th style="width: 120px;">Last Modified</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:urlset/sitemap:url">
                  <tr>
                    <td style="color: #94a3b8; font-weight: 600;">
                      <xsl:value-of select="position()"/>
                    </td>
                    <td>
                      <a class="url-link" target="_blank" rel="noopener">
                        <xsl:attribute name="href">
                          <xsl:value-of select="sitemap:loc"/>
                        </xsl:attribute>
                        <xsl:value-of select="sitemap:loc"/>
                      </a>
                    </td>
                    <td class="col-freq">
                      <span class="badge badge-freq">
                        <xsl:value-of select="sitemap:changefreq"/>
                      </span>
                    </td>
                    <td>
                      <xsl:variable name="prio" select="sitemap:priority"/>
                      <xsl:choose>
                        <xsl:when test="$prio &gt;= 0.9">
                          <span class="badge badge-priority-high">
                            <xsl:value-of select="$prio"/> (High)
                          </span>
                        </xsl:when>
                        <xsl:when test="$prio &gt;= 0.7">
                          <span class="badge badge-priority-mid">
                            <xsl:value-of select="$prio"/>
                          </span>
                        </xsl:when>
                        <xsl:otherwise>
                          <span class="badge badge-priority-low">
                            <xsl:value-of select="$prio"/>
                          </span>
                        </xsl:otherwise>
                      </xsl:choose>
                    </td>
                    <td>
                      <span style="font-family: monospace; font-size: 12px; color: #475569;">
                        <xsl:value-of select="sitemap:lastmod"/>
                      </span>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <div class="footer-note">
            &copy; 2026 PottoTools.in &bull; Built with Privacy-First Client-Side WebAssembly &bull; Free In-Browser Document &amp; Image Suite
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
