const BranchService = require("../services/branchService");

exports.createbranch = async (req, res) => {
    try{
        const savenewBranch = await BranchService.create_branch(req.body);
        res.status(201).json(savenewBranch);

    }
    catch (error){
        res.status(400).json({message : error.message});
    }
};
exports.getAllBranchs = async (req, res) => {
    try{
        const branchs = await BranchService.get_All_Branchs();
        res.status(200).json(branchs);
    }
    catch (error){
        res.status(500).json({message : error.message});
    }
}
exports.getBranchById = async (req, res) => {
    try{
        const branch = await BranchService.getBranchById(req.params.id);
        res.status(200).json(branch);
    }
    catch (error){
        if (error.message === 'Branch not found'){
            return res.status(404).json({message : error.message});
        }
        res.status(500).json({message : error.message});
    }
};
exports.updateBranch = async (req, res) => {
    try{
        const branch = await BranchService.updateBranch(req.params.id, req.body);
        res.status(200).json(branch);
    }
    catch (error){
        if (error.message === 'Branch not found'){
            return res.status(404).json({message : error.message});
        }
        res.status(400).json({message : error.message});
    }
};
exports.deleteBranch = async (req, res) => {
    try{
        const branch = await BranchService.DeleteBranch(req.params.id);
        res.status(200).json(branch);
    }
    catch (error){
        if (error.message === 'Branch not found'){
            return res.status(404).json({message : error.message});
        }
        res.status(500).json({message : error.message});
    }
};
