<template>
  <div class="mx-auto px-4 pt-10 dark:bg-slate-800">
    <Titleheader title="  Publications" />
    <!-- Year Filter -->
    <div class="flex flex-wrap space-x-2 mb-6">
      <button
        v-for="year in availableYears"
        :key="year"
        @click="filterByYear(year)"
        :class="[
          'py-2 px-4 rounded-full text-sm',
          {
            'bg-gray-300 text-black': selectedYear === year,
            'bg-gray-100 text-gray-600 ': selectedYear !== year,
          },
        ]"
      >
        {{ year }}
      </button>
      <button
        @click="filterByYear('all')"
        class="py-2 px-4 rounded-full bg-gray-100 text-gray-600 text-sm dark:text-gray-600"
      >
        All
      </button>
    </div>

    <!-- Publications List -->
    <div
      class="dark:bg-slate-800 dark:text-gray-300"
      v-for="(works, year) in filteredPublications"
      :key="year"
    >

      <h2 class="text-2xl font-semibold mt-6">{{ year }}</h2>
      <ul>
        <li v-for="work in works" :key="work.pmid" class="mb-4">
          <div class="text-xl font-semibold">
            <a
              :href="'https://pubmed.ncbi.nlm.nih.gov/' + work.pmid"
              target="_blank"
              class="hover:underline text-black dark:text-gray-300"
            >
              {{ work.title }}
            </a>
          </div>
          <div class="text-gray-600 mb-2 dark:text-gray-300">
            <span v-for="(author, index) in work.authors" :key="author" class="mr-2">
  {{ author }}<span v-if="index < work.authors.length - 1">,</span>
</span>
          </div>



          <div v-if="work.doi" class="text-sm text-blue-500">
            
            <a :href="'https://doi.org/' + work.doi" target="_blank" class="">
              <span>{{ work.journal }},  </span>
              <span> <strong> {{ work.volume }}  </strong> ({{ work.year }})</span>
            </a>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>


<script setup>
const publications = ref([]);
const selectedYear = ref("all");
const availableYears = ref([]);
const filteredPublications = ref({});

onMounted(async () => {
  try {
    // Fetch the improved JSON file
    const response = await fetch("/data/publications.json"); // Update the path accordingly
    const publicationData = await response.json();
    
    // Directly use the publication data with year and authors already in the desired format
    publications.value = publicationData;

    // Get available years from the data
    const years = publications.value
      .map((work) => work.year) // No need to extract year from date anymore
      .filter(Boolean);
    availableYears.value = [...new Set(years)].sort((a, b) => b - a);

    filterByYear("all");
  } catch (error) {
    console.error("Error fetching publications data:", error);
  }
});


function filterByYear(year) {
  selectedYear.value = year;
  if (year === "all") {
    filteredPublications.value = groupByYear(publications.value);
  } else {
    const filtered = publications.value.filter(
      (work) => work.year === year // Filter by publication year
    );
    filteredPublications.value = groupByYear(filtered);
  }
}

function groupByYear(works) {
  const grouped = works.reduce((acc, work) => {
    const year = work.year;
    if (!acc[year]) acc[year] = [];
    acc[year].push(work);
    return acc;
  }, {});

  // Sort years and works in descending order
  return Object.keys(grouped)
    .sort((a, b) => b - a) // Sort years by most recent first
    .reduce((sortedAcc, year) => {
      sortedAcc[year] = grouped[year].sort(
        (a, b) => b.date - a.date
      ); // Sort publications by most recent first within each year
      return sortedAcc;
    }, {});
}


</script>

<style scoped>
.container {
  max-width: 1200px;
}
</style>
