function numberConverter(amount) {
	return Number(amount)
		.toFixed(0)
		.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


module.exports = numberConverter;