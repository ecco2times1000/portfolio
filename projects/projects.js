import { fetchJSON, renderProjects } from '../global.js';
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle) {
    projectsTitle.textContent = `${projects.length} Projects`;
}

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);

let selectedYear = null;
let selectedIndex = -1;
let query = '';
let searchInput = document.querySelector('.searchBar');

function renderPieChart(projectsGiven) {
  let newSVG = d3.select('svg'); 
  newSVG.selectAll('path').remove();
  
  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  let newData = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let newArcs = newArcData.map((d) => arcGenerator(d));

  newArcs.forEach((arc, i) => {
    newSVG.append('path')
          .attr('d', arc)
          .attr('fill', colors(i))
          // ADD THIS LINE to re-apply the selected class when redrawing
          .attr('class', newData[i].label === selectedYear ? 'selected' : '')
          .on('click', () => {
              // 1. Toggle the selected index
              selectedIndex = selectedIndex === i ? -1 : i;

              // 2. Update the CSS class on all paths (highlight clicked)
              newSVG.selectAll('path')
                    .attr('class', (_, idx) => (
                        idx === selectedIndex ? 'selected' : ''
                    ));

              // 3. Update the CSS class on all legend items (highlight clicked)
              legend.selectAll('li')
                    .attr('class', (_, idx) => (
                        idx === selectedIndex ? 'legend-item selected' : 'legend-item'
                    ));

            // 1. UPDATE THE SELECTED YEAR VARIABLE
            selectedYear = selectedIndex === -1 ? null : newData[selectedIndex].label;

            // (Keep your CSS class updates for the path and legend here)

            // 2. APPLY BOTH FILTERS
            let filteredProjects = projects.filter((project) => {
                // Check search query
                let values = Object.values(project).join('\n').toLowerCase();
                let matchesQuery = values.includes(query.toLowerCase());

                // Check selected year
                let matchesYear = selectedYear ? project.year === selectedYear : true;

                // Must match BOTH
                return matchesQuery && matchesYear;
            });

                renderProjects(filteredProjects, document.querySelector('.projects'), 'h2');
          });
  });

  newData.forEach((d, idx) => {
    legend.append('li')
          .attr('style', `--color:${colors(idx)}`)
          // UPDATE THIS LINE to check for selectedYear
          .attr('class', d.label === selectedYear ? 'legend-item selected' : 'legend-item')
          .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

renderPieChart(projects);

searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  
  // 1. Filter projects by SEARCH QUERY ONLY
  let projectsMatchingQuery = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  // 2. Filter further by SELECTED YEAR for the project list
  let filteredProjects = projectsMatchingQuery.filter((project) => {
    return selectedYear ? project.year === selectedYear : true;
  });

  // 3. Render project list with BOTH filters
  renderProjects(filteredProjects, document.querySelector('.projects'), 'h2');
  
  // 4. Render pie chart with ONLY the search query data
  renderPieChart(projectsMatchingQuery);
});