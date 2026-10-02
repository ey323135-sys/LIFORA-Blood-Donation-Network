const { supabase } = require('../config/supabase');

// @desc    Submit contact message
// @route   POST /api/contact
// @access  Public
exports.submitContactMessage = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Please enter name, email, and message.' });
    }

    const { data: contact, error } = await supabase
      .from('contact_messages')
      .insert({
        name,
        email: email.toLowerCase().trim(),
        subject: subject || 'General Inquiry',
        message,
        status: 'pending'
      })
      .select('*')
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for contacting LIFORA. Your message has been received.',
      contact: {
        ...contact,
        _id: contact.id
      }
    });
  } catch (error) {
    next(error);
  }
};
