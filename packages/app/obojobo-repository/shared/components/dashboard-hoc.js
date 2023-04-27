const Dashboard = require('./dashboard')
const connect = require('react-redux').connect
const {
	closeModal,
	addUserToModule,
	changeAccessLevel,
	loadUsersForModule,
	deleteModulePermissions,
	createNewCollection,
	loadCollectionModules,
	showCollectionManageModules,
	showCollectionBulkAddModulesDialog,
	collectionAddModule,
	collectionRemoveModule,
	showCollectionRename,
	renameCollection,
	deleteCollection,
	createNewModule,
	filterModules,
	filterCollections,
	selectModules,
	deselectModules,
	deleteModule,
	bulkDeleteModules,
	bulkAddModulesToCollection,
	bulkRemoveModulesFromCollection,
	showModulePermissions,
	showModuleManageCollections,
	loadModuleCollections,
	moduleAddToCollection,
	moduleRemoveFromCollection,
	showVersionHistory,
	showAssessmentScoreData,
	restoreVersion,
	importModuleFile,
	checkModuleLock,
	getDeletedModules,
	getModules,
	bulkRestoreModules,
	showModuleSync,
	syncModuleUpdates
} = require('../actions/dashboard-actions')
const mapStoreStateToProps = state => state
const mapActionsToProps = {
	createNewCollection,
	loadCollectionModules,
	showCollectionManageModules,
	showCollectionBulkAddModulesDialog,
	collectionAddModule,
	collectionRemoveModule,
	showCollectionRename,
	renameCollection,
	deleteCollection,
	createNewModule,
	closeModal,
	addUserToModule,
	changeAccessLevel,
	loadUsersForModule,
	deleteModulePermissions,
	filterModules,
	filterCollections,
	selectModules,
	deselectModules,
	deleteModule,
	bulkDeleteModules,
	bulkAddModulesToCollection,
	bulkRemoveModulesFromCollection,
	showModulePermissions,
	showModuleManageCollections,
	loadModuleCollections,
	moduleAddToCollection,
	moduleRemoveFromCollection,
	showVersionHistory,
	showAssessmentScoreData,
	restoreVersion,
	importModuleFile,
	checkModuleLock,
	getDeletedModules,
	getModules,
	bulkRestoreModules,
	showModuleSync,
	syncModuleUpdates
}
module.exports = connect(
	mapStoreStateToProps,
	mapActionsToProps
)(Dashboard)
