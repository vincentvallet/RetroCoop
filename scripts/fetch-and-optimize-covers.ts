import {runCoverPipeline} from './covers/pipeline';
runCoverPipeline(process.argv.slice(2)).catch(error=>{console.error(error);process.exitCode=1;});

