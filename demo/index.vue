<template>
	<main class="test-page">
		<h1>
            Testing Nestica in Vue file
        </h1>
		<p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. 
            Sed accusantium sint optio obcaecati. Saepe tempore, officiis, magni exercitationem inventore dolore facilis 
            tenetur quod veritatis quam sit vel non aspernatur quae totam pariatur dolores quisquam dolorum sed at repellat 
            quaerat voluptas quis laboriosam! Repellat iure, dolorum unde non voluptatibus nam eaque? Cum delectus sunt ut 
            pariatur assumenda id quod nihil hic? Animi perspiciatis, tenetur quis error perferendis ullam necessitatibus 
            obcaecati voluptas vitae expedita et enim provident debitis cum aperiam repellendus omnis iure odit voluptates 
            neque officia excepturi exercitationem! Consectetur nam quasi quae tempora, laborum neque suscipit iusto ducimus 
            quidem harum cum.
        </p>

		<button @click="increment">Pressed: {{ count }}</button>
	</main>
</template>

<script setup>
    import { ref } from 'vue'

    const count = ref(0)

    const increment = () => {
        count.value++
    }
</script>

<style scoped>
.test-page {
	max-width: 600px;
	margin: 40px auto;
	padding: 20px;
	font-family: Arial, sans-serif;
	line-height: 1.5;
}

button {
	margin-top: 12px;
	padding: 8px 12px;
	border: 1px solid #ccc;
	background: #f7f7f7;
	cursor: pointer;
}

button:hover {
	background: #efefef;
}
</style>
