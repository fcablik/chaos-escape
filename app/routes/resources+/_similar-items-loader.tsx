import { offersAndServicesBoxesClassList, offersAndServicesContainerClassList } from "#app/components/classlists.tsx";

export function SimilarItemsLoader() {

	return (
        <div className={offersAndServicesContainerClassList}>
            <div className="text-center mb-8">
                <h4 className="text-h4 capitalize">find your niche</h4>
            </div>

            <div className="flex gap-5 xl:gap-10 w-full overflow-scroll">
                <div className={offersAndServicesBoxesClassList}>Offers And Services Loader boxes</div>
                <div className={offersAndServicesBoxesClassList}>Offers And Services Loader boxes</div>
                <div className={offersAndServicesBoxesClassList}>Offers And Services Loader boxes</div>
            </div>
        </div>
	)
}
