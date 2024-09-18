const IdeaBox = require('../models/ideaboxModel')
const IdeaBoxCategory = require('../models/ideaboxCategoryModel');


exports.createIdeaBoxCategory = async (req, res) => {
	try {
		const category = await IdeaBoxCategory.create({
			categoryName: req.body.categoryName,
			categoryImage: req.body.categoryImage
		});

		res.status(201).json({
			status: 'success',
			data: {
				category,
			}
		});
	} catch(err) {
		return res.status(400).json({
            status: 'fail',
            message: err.message
        });
	}
}


exports.getAllIdeaBoxCategories = async (req, res) => {
	try {
		const categories = await IdeaBoxCategory.find();
		res.status(200).json({
			status: 'success',
			data: {
				categories
			}
		});

	} catch(err) {
		return res.status(400).json({
            status: 'fail',
            message: err.message
        });
	}
}



exports.createIdeaBox = async (req, res) => {
    try {
        const newIdea = await IdeaBox.create({
            name: req.body.name,
            image: req.body.image,
            category: req.body.category,
        });

		await IdeaBoxCategory.findOneAndUpdate(
			{ categoryName: req.body.category },
			{ $inc: { ideaCounts: 1 } },
			{ runValidators: true, new: true }
		);

        res.status(201).json({
            status: 'success',
            message: `${newIdea?.category} created!`,
            data: {
                idea: newIdea,
            }
        })

    } catch(err) {
        return res.status(400).json({
            status: 'fail',
            message: err.message
        })
    }
}


// ADD idea IMAGE
exports.uploadImg = async (req, res) => {
    try {
        let image;
        if(req.file) image = req.file.filename;

        await IdeaBox.findByIdAndUpdate(req.params.id, { image }, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            status: 'success',
			message: 'Image upload successful'
        });
    } catch(err) {
		return res.status(400).json({
            status: 'fail',
			message: err.message
        });
    }
}



// EVERY idea box
exports.getAllIdeaBox = async (req, res) => {
	try {
		const idea = await IdeaBox.find().sort({ createdAt: -1 });
		res.status(200).json({
			status: 'success',
			count: idea.length,
			data: {
				idea
			}
		});

	} catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}


exports.getIdeaBoxByCategories = async (req, res) => {
    try {
        const ideas = await IdeaBox.find({ category: req.params.category }).sort({ createdAt: -1 });
		res.status(200).json({
            status: 'success',
            count: ideas.length,
			data: {
				ideas
			}
		});

    } catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}