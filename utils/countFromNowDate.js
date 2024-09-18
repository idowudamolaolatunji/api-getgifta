exports.countSixMonthsFromNow = function () {
	const currentDate = new Date();
	const futureDate = new Date(currentDate);
	futureDate.setMonth(currentDate.getMonth() + 6);
	return futureDate.toISOString().slice(0, 10);
};

exports.countOneYearFromNow = function () {
	const currentDate = new Date();
	const futureDate = new Date(currentDate);
	futureDate.setFullYear(currentDate.getFullYear() + 1);
	return futureDate.toISOString().slice(0, 10);
};
