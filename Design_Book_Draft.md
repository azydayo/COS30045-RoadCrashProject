# Visualisation Design Book Draft

## Title Page

**Project title:** A Decade in Review: Trends, Gaps and Vulnerability Analysis of Hospitalised Injuries from Road Traffic Accidents in Australia (2011-2021)

**Website title:** Road Injury Insights Australia

**Team name:** [To be completed]

**Student names and IDs:** Nguyen Thien Khanh 105551558 ， Yifan Li 105205224

**Tutorial day and time:** monday 10:30am - 12:30am

**Year and semester:** 2026, Semester 1


## Table of Contents

1. Introduction  
   1.1 Background and Motivation  
   1.2 Visualisation Purpose  
2. Data  
   2.1 Data Source and Governance  
   2.2 Data Processing and Analysis  
   2.3 Data Exploration  
3. Visualisation Design  
   3.1 Website Design  
   3.2 Visualisation Design  
   3.3 Interaction Design  
4. Iteration and Validation  
   4.1 Testing and Refinements  
   4.2 Usability Evaluation  
5. Conclusion and Future Improvements  
6. References  
7. Appendices

## 1. Introduction

### 1.1 Background and Motivation

Road traffic accidents remain a major public health, transport safety and social equity issue in Australia. Fatal road crashes receive frequent public attention, but hospitalised injuries show a broader and often less visible burden: people may survive a crash but still require emergency treatment, hospital admission, rehabilitation and time away from work, school and community life. This project focuses on hospitalised injuries from road traffic accidents in Australia between 2011 and 2021.

The target audience for the visualisation includes:

- General public users who want a clear overview of road injury patterns.
- Road safety analysts who need to compare trends across road user groups, age groups and jurisdictions.
- Policymakers and public health stakeholders who need evidence about vulnerable groups and equity gaps.
- Students and educators who need an accessible example of data-driven visual storytelling.

The project is important because it turns a large and technical road injury dataset into a set of focused visual questions. Instead of only reporting a national total, the visualisation explores who is affected, where the burden is concentrated, how the situation changed over a decade, and which groups may require targeted policy attention.

The key tasks users should be able to perform are:

- Identify national changes in hospitalised road crash injuries from 2011 to 2021.
- Compare the relative burden across road user types such as car drivers, motorcyclists, pedal cyclists and pedestrians.
- Explore age-based vulnerability patterns over time.
- Compare state and territory changes across the decade.
- Examine differences between First Nations peoples and Non-Indigenous Australians.
- Compare hospitalisation patterns across Major Cities, Regional areas and Remote areas.

### 1.2 Visualisation Purpose

The purpose of the visualisation is to support a decade-level review of Australian road crash hospitalisations by combining trend, gap and vulnerability analysis in one interactive website. The central research theme is:

**How did hospitalised injuries from road traffic accidents in Australia change between 2011 and 2021, and which groups or places appear most vulnerable?**

The specific questions addressed by the visualisation are:

1. How did national hospitalised road crash injuries change between 2011 and 2021?
2. Which road user groups account for the largest share of hospitalisations?
3. Which age groups show the highest hospitalisation shares across the decade?
4. Which states and territories experienced the largest percentage changes?
5. Did First Nations peoples and Non-Indigenous Australians experience similar or different growth patterns?
6. How does remoteness relate to road crash hospitalisation patterns?

The completed visualisation supports decision-making by:

- Making long-term changes easier to see than in raw tables.
- Identifying vulnerable road user groups for safety campaigns.
- Highlighting geographic and population-based equity gaps.
- Supporting evidence-based discussion about resource allocation, regional safety planning and public health pressure.

## 2. Data

### 2.1 Data Source and Governance

The project uses processed hospitalised road crash injury datasets prepared through KNIME and exported as CSV files for the website. The development guide identifies three main source areas:

- National hospitalisation injury data: annual road crash hospitalisations, bed days, road user groups, age groups, sex, remoteness areas and injury categories from 2011 to 2021.
- State and territory hospitalisation injury data: hospitalised road crash injury records by Australian state and territory, including annual totals, road user groups, age groups, sex, counterparty and bed days.
- First Nations hospitalised injury data: comparisons between First Nations peoples and Non-Indigenous Australians, including annual totals, road user groups, age groups, remoteness areas, counterparty and bed days.

The public source context for this project is the Australian road safety hospitalised injury data prepared from AIHW data and published through the National Road Safety Data Hub / Office of Road Safety. The relevant public page states that hospitalised injury data covers road crash hospitalisations in Australia from 2011 to 2021 and includes year, remoteness, road user and vehicle type, sex, age group and counterparty.

| Dataset used in website | DataSet name | Main fields | Role in visualisation |
|---|---|---|---|
| National bed-days trend | `Bed-days-National-trend.csv` | Calendar year, mean bed days | Healthcare impact trend |
| Road user percentage | `hospitalization_road_user_percentage.csv` | Calendar year, road user, cases, annual total, percentage | Road user ranking and national totals |
| Age group percentage | `hospitalization_age_group_percentage.csv` | Calendar year, age group, total, percentage | Age pattern heatmap |
| State and territory percentage | `hospitalization_state_terr_percentage.csv` | Calendar year, state/territory, cases, percentage | State comparison |
| First Nations comparison | `hospitalisations_for_First_Nat_and_Nons.csv` | Calendar year, First Nations status, hospitalisations, bed days | Indexed equity comparison |
| Remoteness comparison | `hospitalisations_for_remoteness_comp.csv` | Calendar year, remoteness area, First Nations status, hospitalisations, bed days, percentages | Remoteness equity comparison |

**Data collection process.** The raw data was reviewed according to the project development guide, then transformed into topic-specific CSV files in KNIME. Each output file supports one section of the website, allowing the JavaScript/D3 implementation to load smaller and clearer data tables.

**Data quality assessment.** The project checks for missing years, duplicate state rows and inconsistent numeric fields during processing and rendering. In the website code, numeric conversion is handled when the CSV files are loaded, and duplicated state rows are aggregated before percentage change is calculated.

**Security, privacy and ethics.** The data is aggregated and does not include identifiable personal information. This reduces privacy risk. However, the project still involves sensitive population categories, including First Nations status and remoteness. The design therefore avoids blaming individuals or communities and frames differences as road safety, access and policy issues. Labels use respectful terminology such as "First Nations people" and "Non-Indigenous".

**How the data supports the project questions.** The six CSV outputs map directly to the questions in Section 1.2: national trend, road users, age groups, states and territories, First Nations comparison and remoteness comparison. This alignment ensures that each visualisation has a clear analytical purpose.

### 2.2 Data Processing and Analysis

The data was processed in KNIME and exported into the `knime-output` folder. The processing strategy was to convert broad source tables into smaller analytical datasets for each website section.

Key attributes and data types include:

| Attribute | Type | Description |
|---|---|---|
| Calendar year | Ordinal / temporal | Year from 2011 to 2021 |
| Road user | Categorical | Road user group, such as car driver, motorcyclist, pedal cyclist |
| Age group | Ordinal categorical | Age band, such as 17-25, 40-64, 75+ |
| State or territory | Categorical | Australian jurisdiction |
| First Nations status | Categorical | First Nations people or Non-Indigenous |
| ABS remoteness area | Ordinal categorical | Major Cities, Regional, Remote |
| Hospitalisations | Quantitative ratio | Count of hospitalised injuries |
| Bed days | Quantitative ratio | Hospital bed days linked to hospitalised injuries |
| Percentage share | Quantitative ratio | Group share within a year |
| Indexed growth | Quantitative interval | Relative change where 2011 is set to 100 |

Data cleaning and transformation included:

- Filtering records to the 2011-2021 period.
- Selecting traffic-related hospitalisations.
- Grouping records by year and analytical category.
- Calculating annual totals and percentage shares.
- Creating derived measures such as percentage change from 2011 to 2021.
- Aggregating duplicated rows before calculating state and territory changes.
- Creating indexed values for First Nations and Non-Indigenous comparison so different starting totals can be compared fairly.
- Exporting topic-specific CSV files for D3 loading.

**KNIME workflow screenshot:** [To be inserted: screenshot of the final KNIME workflow showing source input, filtering, grouping, percentage calculation and CSV writer nodes.]

**KNIME workflow file:** [To be appended to submission: `.knwf` / `.knime` workflow file.]

### 2.3 Data Exploration

Initial exploration showed that the dataset supports three main analytical directions: trend analysis, vulnerability profiling and equity gap analysis.

Key observations from the processed data include:

- National hospitalised road crash injuries increased from 34,033 cases in 2011 to 39,505 cases in 2021, an increase of about 16.1%.
- In 2021, the largest road user shares were car drivers at 33.7%, motorcyclists at 22.5% and pedal cyclists at 20.7%.
- The 40-64 age group represented the largest age share in 2021 at 32.5%, followed by 75+ at 21.4% and 65-74 at 19.4%.
- Mean bed days increased from about 2,302.7 in 2011 to 2,528.8 in 2021, an increase of about 9.8%, suggesting a rising healthcare burden in the available bed-days indicator.
- The aggregated First Nations hospitalisations increased from 1,153 in 2011 to 2,183 in 2021, while Non-Indigenous hospitalisations increased from 31,491 to 36,186. This makes indexed growth useful because the two groups have very different baseline counts.
- State and territory percentage change varied widely. In the processed state dataset, Queensland, Tasmania and the Northern Territory showed the largest positive percentage changes, while New South Wales decreased across the period.

Exploratory visualisations used or planned include:

- Line chart for national hospitalisation trends.
- Horizontal bar chart for road user rankings.
- Heatmap for year-by-age group patterns.
- Horizontal bar chart for state and territory percentage change.
- Indexed line chart for First Nations comparison.
- Grouped bar chart for remoteness comparison.

Challenges encountered during exploration included duplicated rows in some processed state and remoteness outputs, different baseline sizes between population groups, and the need to avoid overinterpreting percentages without showing the underlying counts.

## 3. Visualisation Design

### 3.1 Website Design

The website is designed as a routed D3 dashboard with a homepage and six focused dashboard pages. The homepage introduces the project and provides navigation cards for each topic. The dashboard pages share a consistent structure:

- Top navigation with sections: Home, National, Road Users, Age, States and Equity.
- A dashboard header with a short purpose statement.
- KPI cards showing key figures for the selected topic.
- A main chart panel.
- Insight cards explaining the main patterns.

The current website structure is:

- Home: introduction and dashboard topic cards.
- National: hospitalisations and bed-days trend.
- Road Users: ranked road user share in 2021.
- Age: heatmap of hospitalisation share by age group and year.
- States: state and territory percentage change from 2011 to 2021.
- First Nations: indexed hospitalisation growth from 2011.
- Equity: remoteness comparison by population group.
- Process: working process accordion.

**Wireframe placeholder:** [To be inserted: website wireframe showing homepage navigation, dashboard tabs, KPI row, chart panel and insight cards.]

**Storyboard placeholder:** [To be inserted: storyboard showing a user entering from homepage, selecting a topic, reading KPIs, hovering chart values and using insights to answer a policy question.]

### 3.2 Visualisation Design

The visualisation design follows the development guide by matching each data question to an appropriate chart form.

| Section | Chart type | Design justification |
|---|---|---|
| National | Line chart with bed-day bars | A line chart clearly shows change over time; bars allow bed-days context to be compared with hospitalisation movement |
| Road Users | Horizontal bar chart | Rankings are easier to read with horizontal labels, especially for long road user category names |
| Age Patterns | Heatmap | A heatmap supports comparison across two dimensions: year and age group |
| States | Horizontal bar chart | Percentage change by jurisdiction is a ranking task, so bars allow quick comparison |
| First Nations | Indexed line chart | Indexing both groups to 100 in 2011 makes relative growth comparable despite different baseline counts |
| Remoteness | Grouped bar chart | Grouped bars support comparison across remoteness categories and population groups |

**Graphical integrity.** The design avoids 3D effects, misleading axes and decorative distortion. Percentage charts are labelled clearly, and state comparisons use aggregated start and end counts before calculating change. The First Nations chart uses indexed growth specifically because direct count comparison would hide the relative change experienced by the smaller population group.

**Accessibility.** The site uses a high-contrast palette based on lime green, dark charcoal, white and supporting colours. Text labels, KPI cards and tooltips provide numeric values so users do not need to rely on colour alone. The navigation is keyboard-friendly through normal links and buttons, and chart pages use concise headings and descriptions.

**Scalability and responsiveness.** The website uses responsive CSS with media queries for tablet and mobile widths. The chart SVGs use `viewBox`, and the route is redrawn on window resize so visualisations remain readable across screen sizes.

**Use of graphical elements.**

- Colour separates categories and highlights the selected analytical focus.
- Size encodes quantitative values in bars and heatmap cell intensity.
- Position encodes time in line charts and ranking in bar charts.
- Labels and tooltips expose exact values.
- Insight cards translate visual patterns into short written findings.

The chosen visual style is intentionally clear and public-facing. It uses strong borders, cards and a limited colour palette to make the dashboard approachable while still supporting analytical comparison.

### 3.3 Interaction Design

The project uses lightweight interactions to help users move between sections and inspect data values without overwhelming them.

| Interaction method | Location | Expected user behaviour and response |
|---|---|---|
| Click navigation links | Header and dashboard tabs | User moves between Home, National, Road Users, Age, States, First Nations and Equity pages |
| Click topic cards | Homepage | User opens the selected dashboard topic |
| Hover chart elements | Main chart panels | Tooltip appears with exact category, year, count or percentage value |
| Click accordion rows | Process page | Working process section expands or collapses |
| Window resize | All dashboard pages | Chart redraws to fit the available viewport |
| Mobile menu toggle | Small screens | Navigation menu opens and closes |

The interaction design supports the project purpose by making the visualisation exploratory but focused. Users can switch topics quickly, inspect exact values on demand, and read short insight summaries when they need interpretation.

## 4. Iteration and Validation

### 4.1 Testing and Refinements

The project followed an iterative process from data preparation to interface refinement.

Initial design decisions came from the development guide, which specified the datasets to produce and suggested the main visualisation sections. The first implementation created a homepage and topic structure. Later iterations expanded this into routed dashboard pages using D3 and CSV loading from the KNIME output folder.

Refinements made or planned include:

- Separating the project into six focused dashboard sections rather than placing all charts on one long page.
- Adding KPI cards so users can quickly read headline values before interpreting charts.
- Aggregating duplicated rows in JavaScript for state and First Nations calculations.
- Using indexed growth for First Nations comparison to avoid misleading direct count comparison.
- Adding tooltips so exact values are available without cluttering the chart.
- Adding responsive layout rules for dashboard tabs, KPI cards and chart panels.

**Before-and-after placeholder:** [To be inserted: screenshot of early homepage/prototype and screenshot of final routed dashboard.]

**Programming issue adjustments.** Because some CSV files contain repeated rows, the D3 code aggregates rows before rendering selected charts. Because the site is a static HTML/CSS/JavaScript dashboard, all data files are loaded as local CSV files through D3 rather than through a backend API.

**Accessibility features.** Current accessibility features include semantic headings, descriptive page sections, high contrast text, large clickable navigation targets, responsive layout and tooltips with exact values. Further accessibility testing should include colour contrast validation and keyboard-only navigation testing.

### 4.2 Usability Evaluation

The usability evaluation should test whether users can answer the project questions using the website.

Suggested participant profile:

- 3-5 participants, including at least one person familiar with data visualisation and one general public user.

Suggested usability tasks:

1. Find the national change in hospitalised road crash injuries between 2011 and 2021.
2. Identify the top three road user groups in 2021.
3. Use the age heatmap to identify the highest-share age group in 2021.
4. Compare which state or territory had the largest percentage increase.
5. Explain whether First Nations and Non-Indigenous trends changed at the same rate.
6. Use the remoteness chart to compare Major Cities, Regional and Remote patterns.

Suggested evaluation measures:

- Task completion success.
- Time taken to complete each task.
- Number of navigation errors.
- Participant confidence rating from 1 to 5.
- Qualitative comments about chart readability, labels, colours and page flow.

**Usability evaluation results placeholder:** [To be inserted after testing: participant notes, task success table and design changes made in response.]

## 5. Conclusion and Future Improvements

This project demonstrates how hospitalised road crash injury data can be turned into a public-facing visual dashboard. The main findings from the processed data suggest that hospitalised injuries increased across the decade, that car drivers, motorcyclists and pedal cyclists form the largest road user shares, that older adult age groups account for a substantial share, and that First Nations indexed growth deserves close policy attention.

The project also shows the value of separating road injury analysis into multiple views. A single national total does not explain vulnerability or equity. By combining road user, age, state, First Nations and remoteness perspectives, the visualisation gives users a more complete understanding of where the road injury burden appears concentrated.

Future improvements could include:

- Adding sex and counterparty filters to support deeper exploration.
- Adding rate-per-population measures where population denominators are available.
- Adding downloadable chart images or data tables for analysts.
- Improving mobile chart readability with simplified axis labels.
- Conducting formal usability testing and applying the findings.
- Adding more detailed annotations for major changes between 2019, 2020 and 2021.
- Comparing hospitalised injuries with fatality trends to show the full road trauma picture.

## References

Australian Institute of Health and Welfare. (n.d.). *Hospitalised injury due to land transport crashes*. Australian Government. https://www.aihw.gov.au/reports/injury/hospitalised-injury-due-to-land-transport-crashes/summary

Bureau of Infrastructure and Transport Research Economics. (n.d.). *Hospitalised injury*. Australian Government. https://www.bitre.gov.au/publications/ongoing/hospitalised-injury

Office of Road Safety. (n.d.). *Injuries data*. Australian Government. https://www.officeofroadsafety.gov.au/data-hub/serious-injuries-data

National Road Safety Data Hub. (n.d.). *Hospitalised injuries from road crashes*. Australian Government. https://datahub.roadsafety.gov.au/safe-systems/safe-road-use/hospitalised-injuries-road-crashes

D3.js. (n.d.). *D3: Data-Driven Documents*. https://d3js.org/

KNIME. (n.d.). *KNIME Analytics Platform*. https://www.knime.com/knime-analytics-platform

## Appendices

### Appendix A: Gen AI Declaration

Generative AI was used to assist with drafting and structuring the Design Book text based on the project template, development guide, processed CSV files and existing website implementation. The team reviewed, edited and verified the final submission content, including all project-specific claims, screenshots and evaluation results.


