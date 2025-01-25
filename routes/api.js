'use strict';
const Thread = require('../models/Thread');

module.exports = function (app) {
  /**
   * This function is used for creating a board for a thread from the form
   * in the front end sent using POST method
   * eg: Flickr
   * Text = Lily of the vine, the unusual species
   * Password = 1234567890
   */
  app.route('/api/threads/:board')
  .post(async (req, res)=>{
    const { board } = req.params;
    const { text, delete_password } = req.body;
    console.log(`Creating a thread board.`);
    try{
      const newThread = new Thread({ board, text, delete_password });
      const savedThread = await newThread.save();
      res.json({ success: true, thread: savedThread });

    } catch (err) {
      res.status(500).json({error: 'Unable to create thread'})
    }
  });
   
  /**
   * This function will handle a reply to threads' board sent
   * using the POST method.
   */

  app.route('/api/replies/:board')
  .post(async (request, response)=>{

    const { board } = request.params;
    const { thread_id, text, delete_password } = request.body;

    if (!thread_id || !text || !delete_password) {
      return response.status(400).json({ error: 'Missing required fields' });
    }

    try{
      const thread = await Thread.findOne({ _id: thread_id, board });

      if (!thread) {
      return response.status(404).json({ error: 'Thread not found' });
      }

      const newReply = {
        text,
        delete_password,
      };

      thread.replies.push(newReply);
      thread.bumped_on = new Date(); 
      await thread.save();

      response.json({ success: true, thread });
    } catch(err){
      console.error(err);
      response.status(500).json({error: 'Unable to add reply'});
    }
  });

  /**
   * This function is used to retrieve 10 most recent replies to a thread
   * The request is done using the GET method
   */
  app.route('/api/threads/:board')
  .get(async function(req, res){
    const { board } = req.params;

  try {
    const threads = await Thread.find({ board })
      .sort({ bumped_on: -1 })
      .limit(10)
      .select('-delete_password -reported')
      .lean();
    res.json(threads);
  } catch (err) {
    res.status(500).json({ error: 'Unable to fetch threads' });
  }
  });

  /*
  * This function retrieves all the replies for a particular thread_id using GET
  * The replies are rendered as an array but the reported and delete_password
  * is not going to be shown
  */

  app.route('/api/replies/:board')
  .get(async function(req, res){
    const { board } = req.params;
    const { thread_id } = req.query;
  
    if (!thread_id) {
      return res.status(400).json({ error: 'Missing required thread_id query parameter' });
    }
  
    try {
      const thread = await Thread.findOne({ _id: thread_id, board }).select('-delete_password -reported');
  
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }
  
      res.json(thread);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Unable to retrieve replies' });
    }
  });

};
