import { getYear } from "date-fns";

export function FooterBase() {
    const currentYear = getYear(new Date())
    const companyName = "company Name s.r.o."

	return (
        <>
            <footer className="shadow-md rounded-xl">
                <div className='drop-shadow-2xl'>
                    <div className="rounded-t-xl px-4 md:px-8 lg:px-10 xl:px-12 3xl:px-16">
                        <div className="flex justify-between py-32">
                            <div>interesting items here</div>
                            <div className="font-bold capitalize">Chaos Escape app</div>
                            <div>footer right here</div>
                        </div>
                    </div>

                    <div className='py-4 px-4 md:px-8 lg:px-10 xl:px-12 3xl:px-16'>
                        <div className="flex max-md:flex-col max-md:text-center justify-between text-sm">
                            <div className="max-md:hidden">2023-{currentYear}</div>
                            <div className="capitalize flex gap-2 max-md:justify-center items-center">
                                <span className="text-xs">developed and created by</span>
                            </div>
                            <div className="capitalize">©{' '}{companyName}</div>
                        </div>
                    </div>
                </div>

                {/* <div className='h-16 md:hidden'/> */}
            </footer>

            <div className='h-20 md:hidden' />
        </>
    )
}
