import { NextApiRequest, NextApiResponse } from 'next';
import { testOpenAIFunction } from '../../utils/firebase';
import { testApiConnection } from '../../utils/api-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed, use GET' });
  }

  try {
    console.log('Testing Firebase and OpenAI connections...');
    
    // First try direct API connection
    try {
      const apiResult = await testApiConnection();
      
      if (apiResult.success) {
        return res.status(200).json({
          status: 'success',
          connection: 'direct',
          results: apiResult.data,
          message: 'API connection test completed successfully'
        });
      }
    } catch (directError) {
      console.error('Direct API connection test failed:', directError);
    }
    
    // Fallback to the callable function
    console.log('Trying callable function...');
    const openaiResult = await testOpenAIFunction();
    
    return res.status(200).json({
      status: 'success',
      connection: 'callable',
      openai: openaiResult.data,
      message: 'Connection test completed via callable function'
    });
  } catch (error: any) {
    console.error('All connection tests failed:', error);
    return res.status(500).json({
      status: 'error',
      error: error.message,
      message: 'All connection tests failed'
    });
  }
}